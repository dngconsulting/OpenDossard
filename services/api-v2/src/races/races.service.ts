import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { PaginatedResponseDto } from '../common/dto';
import { CompetitionType } from '../common/enums';
import {
  CreateEngagementDto,
  FilterRaceDto,
  RaceRowDto,
  UpdateRankingDto,
  RemoveRankingDto,
  ReorderRankingItemDto,
  PalmaresResponseDto,
  PalmaresResultDto,
  PalmaresStatsDto,
  PalmaresCategoryChangeDto,
} from './dto';

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(RaceEntity)
    private readonly raceRepository: Repository<RaceEntity>,
    @InjectRepository(LicenceEntity)
    private readonly licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Récupère toutes les races avec pagination et filtres
   */
  async findAll(filterDto: FilterRaceDto): Promise<PaginatedResponseDto<RaceEntity>> {
    const { page = 1, limit = 50, competitionId, licenceId, raceCode } = filterDto;

    const queryBuilder = this.raceRepository
      .createQueryBuilder('race')
      .leftJoinAndSelect('race.competition', 'competition')
      .leftJoinAndSelect('race.licence', 'licence');

    if (competitionId) {
      queryBuilder.andWhere('race.competitionId = :competitionId', { competitionId });
    }

    if (licenceId) {
      queryBuilder.andWhere('race.licenceId = :licenceId', { licenceId });
    }

    if (raceCode) {
      queryBuilder.andWhere('race.raceCode = :raceCode', { raceCode });
    }

    queryBuilder.orderBy('race.id', 'DESC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Récupère tous les engagements d'une compétition avec les infos des coureurs
   */
  async findByCompetition(competitionId: number): Promise<RaceRowDto[]> {
    const query = `
      SELECT
        r.id,
        r.race_code AS "raceCode",
        r.catev,
        r.catea,
        r.chrono,
        r.tours,
        r.rider_dossard AS "riderNumber",
        r.ranking_scratch AS "rankingScratch",
        r.number_min AS "numberMin",
        r.number_max AS "numberMax",
        r.licence_id AS "licenceId",
        r.sprintchallenge,
        r.comment,
        r.competition_id AS "competitionId",
        r.club,
        CONCAT(l.name, ' ', l.first_name) AS name,
        l.licence_number AS "licenceNumber",
        l.dept,
        l.gender,
        l.fede,
        l.birth_year AS "birthYear"
      FROM race r
      JOIN licence l ON r.licence_id = l.id
      WHERE r.competition_id = $1
      ORDER BY r.id DESC
    `;

    return this.dataSource.query(query, [competitionId]);
  }

  /**
   * Récupère le palmarès d'un coureur avec stats, historique catégories et résultats
   */
  async getPalmares(licenceId: number): Promise<PalmaresResponseDto> {
    // a) Fetch licence
    const licence = await this.licenceRepository.findOne({ where: { id: licenceId } });
    if (!licence) {
      throw new NotFoundException(`Licence with ID ${licenceId} not found`);
    }

    // b) Single SQL query with rankingInCategory and totalInCategory
    const query = `
      SELECT
        r.id,
        r.competition_id AS "competitionId",
        c.event_date AS "date",
        c.name AS "competitionName",
        c.competition_type AS "competitionType",
        r.race_code AS "raceCode",
        r.ranking_scratch AS "rankingScratch",
        r.comment,
        r.catev,
        CASE
          WHEN r.ranking_scratch IS NOT NULL AND r.comment IS NULL THEN
            (SELECT COUNT(*)
             FROM race rr
             WHERE rr.competition_id = r.competition_id
               AND rr.race_code = r.race_code
               AND rr.catev = r.catev
               AND rr.ranking_scratch IS NOT NULL
               AND rr.comment IS NULL
               AND rr.ranking_scratch <= r.ranking_scratch)
          ELSE NULL
        END AS "rankingInCategory",
        (SELECT COUNT(*)
         FROM race rr
         WHERE rr.competition_id = r.competition_id
           AND rr.race_code = r.race_code
           AND rr.catev = r.catev
           AND rr.ranking_scratch IS NOT NULL
           AND rr.comment IS NULL) AS "totalInCategory"
      FROM race r
      JOIN competition c ON r.competition_id = c.id
      WHERE r.licence_id = $1
        AND (r.ranking_scratch IS NOT NULL OR r.comment IS NOT NULL)
      ORDER BY c.event_date DESC, r.id DESC
    `;

    const rows: Array<{
      id: number;
      competitionId: number;
      date: string;
      competitionName: string;
      competitionType: string;
      raceCode: string;
      rankingScratch: number | null;
      comment: string | null;
      catev: string;
      rankingInCategory: number | null;
      totalInCategory: number;
    }> = await this.dataSource.query(query, [licenceId]);

    // c) Compute stats — COUNT(*) returns bigint which pg driver serializes as string
    const ranked = rows
      .filter((r) => r.rankingInCategory != null)
      .map((r) => ({ ...r, rankingInCategory: Number(r.rankingInCategory) }));
    const stats: PalmaresStatsDto = {
      totalRaces: rows.length,
      wins: ranked.filter((r) => r.rankingInCategory === 1).length,
      podiums: ranked.filter((r) => r.rankingInCategory <= 3).length,
      topTen: ranked.filter((r) => r.rankingInCategory <= 10).length,
      bestRanking: ranked.length > 0
        ? Math.min(...ranked.map((r) => r.rankingInCategory))
        : 0,
    };

    // d) Compute categoryHistory — every catev change chronologically
    const sortedAsc = [...rows].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dateCompare !== 0 ? dateCompare : a.id - b.id;
    });

    const categoryHistory: PalmaresCategoryChangeDto[] = [];
    let lastCatev: string | null = null;

    for (const row of sortedAsc) {
      if (row.catev && row.catev !== lastCatev) {
        const season = new Date(row.date).getFullYear().toString();
        let direction: 'up' | 'down' | 'initial' = 'initial';

        if (lastCatev !== null) {
          const oldNum = parseInt(lastCatev.replace(/\D/g, ''), 10);
          const newNum = parseInt(row.catev.replace(/\D/g, ''), 10);
          if (!isNaN(oldNum) && !isNaN(newNum)) {
            direction = newNum < oldNum ? 'up' : 'down';
          }
        }

        categoryHistory.push({
          season,
          fromCategory: lastCatev,
          toCategory: row.catev,
          direction,
        });

        lastCatev = row.catev;
      }
    }

    // e) Map rows to PalmaresResultDto[]
    const results: PalmaresResultDto[] = rows.map((r) => ({
      id: r.id,
      competitionId: r.competitionId,
      date: r.date,
      competitionName: r.competitionName,
      competitionType: r.competitionType,
      raceCode: r.raceCode,
      catev: r.catev,
      rankingScratch: r.rankingScratch,
      rankingInCategory: r.rankingInCategory != null ? Number(r.rankingInCategory) : null,
      totalInCategory: Number(r.totalInCategory),
      comment: r.comment,
    }));

    // f) Return full response
    return { licence, stats, categoryHistory, results };
  }

  /**
   * Recherche des licences ayant un palmarès (au moins une course)
   */
  async getLicencesWithPalmares(searchQuery: string): Promise<LicenceEntity[]> {
    const normalizedQuery =
      '%' +
      searchQuery
        .replace(/\s+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') +
      '%';

    const query = `
      SELECT DISTINCT
        l.id,
        l.licence_number AS "licenceNumber",
        l.club,
        l.gender,
        l.name,
        l.dept,
        l.fede,
        l.first_name AS "firstName",
        l.birth_year AS "birthYear",
        l.saison,
        l.catea
      FROM licence l
      JOIN race r ON r.licence_id = l.id
      WHERE REPLACE(CONCAT(UPPER(l.name), UPPER(unaccent(l.first_name))), ' ', '') LIKE $1
         OR REPLACE(CONCAT(UPPER(unaccent(l.first_name)), UPPER(l.name)), ' ', '') LIKE $1
      ORDER BY l.name
      FETCH FIRST 30 ROWS ONLY
    `;

    return this.dataSource.query(query, [normalizedQuery]);
  }

  /**
   * Récupère une race par son ID
   */
  async findOne(id: number): Promise<RaceEntity> {
    const race = await this.raceRepository.findOne({
      where: { id },
      relations: ['competition', 'licence'],
    });
    if (!race) {
      throw new NotFoundException(`Race with ID ${id} not found`);
    }
    return race;
  }

  /**
   * Engage un coureur sur une compétition
   * Avec validations : licence existe, dossard pas pris, licence pas déjà inscrite
   */
  async engage(dto: CreateEngagementDto): Promise<RaceEntity> {
    // Validation : licence requise
    const licence = await this.licenceRepository.findOne({
      where: { id: dto.licenceId },
    });
    if (!licence) {
      throw new BadRequestException('Licence inconnue');
    }

    // Validation : compétition existe
    const competition = await this.competitionRepository.findOne({
      where: { id: dto.competitionId },
    });
    if (!competition) {
      throw new BadRequestException('Compétition inconnue');
    }

    // Validation : dossard pas déjà pris sur cette course
    const numberConflict = await this.raceRepository.findOne({
      where: {
        competitionId: dto.competitionId,
        riderNumber: dto.riderNumber,
        raceCode: dto.raceCode,
      },
    });
    if (numberConflict) {
      throw new BadRequestException(
        `Le numéro de dossard ${dto.riderNumber} est déjà pris`,
      );
    }

    // Validation : licence pas déjà inscrite sur cette course
    const licenceConflict = await this.raceRepository.findOne({
      where: {
        competitionId: dto.competitionId,
        licenceId: dto.licenceId,
        raceCode: dto.raceCode,
      },
    });
    if (licenceConflict) {
      throw new BadRequestException(
        'Ce licencié est déjà inscrit sur cette épreuve',
      );
    }

    // Création de l'engagement
    const race = new RaceEntity();
    race.raceCode = dto.raceCode;
    race.riderNumber = dto.riderNumber;
    race.licenceId = dto.licenceId;
    race.competitionId = dto.competitionId;
    race.catev = dto.catev;
    race.catea = dto.catea || licence.catea;
    race.club = dto.club || licence.club;
    race.rankingScratch = dto.rankingScratch ?? null;

    return this.raceRepository.save(race);
  }

  /**
   * Rafraîchit l'engagement depuis les données de la licence
   */
  async refreshEngagement(
    licenceId: number,
    competitionId: number,
  ): Promise<RaceEntity> {
    const licence = await this.licenceRepository.findOne({
      where: { id: licenceId },
    });
    if (!licence) {
      throw new NotFoundException('Licence non trouvée');
    }

    const race = await this.raceRepository.findOne({
      where: { licenceId, competitionId },
      relations: ['competition'],
    });
    if (!race) {
      throw new NotFoundException('Engagement non trouvé');
    }

    // Mise à jour depuis la licence
    race.club = licence.club;
    race.catea = licence.catea;
    race.catev =
      race.competition?.competitionType === CompetitionType.CX
        ? licence.catevCX || licence.catev
        : licence.catev;

    return this.raceRepository.save(race);
  }

  /**
   * Toggle le flag sprint challenge
   */
  async toggleSprintChallenge(id: number): Promise<RaceEntity> {
    const race = await this.findOne(id);
    race.sprintchallenge = !race.sprintchallenge;
    return this.raceRepository.save(race);
  }

  /**
   * Met à jour le chrono d'un coureur
   */
  async updateChrono(id: number, chrono: string): Promise<RaceEntity> {
    const race = await this.findOne(id);
    race.chrono = chrono;
    return this.raceRepository.save(race);
  }

  /**
   * Met à jour le nombre de tours d'un coureur
   */
  async updateTours(id: number, tours: number | null): Promise<RaceEntity> {
    const race = await this.findOne(id);
    race.tours = tours;
    return this.raceRepository.save(race);
  }

  /**
   * Met à jour le classement d'un coureur
   */
  async updateRanking(dto: UpdateRankingDto): Promise<RaceEntity> {
    // Trouver le coureur à classer
    const rider = await this.raceRepository.findOne({
      where: {
        riderNumber: dto.riderNumber,
        raceCode: dto.raceCode,
        competitionId: dto.competitionId,
      },
    });

    if (!rider) {
      throw new BadRequestException(
        "Impossible de classer ce coureur, il n'existe pas",
      );
    }

    // Vérifier qu'il n'est pas déjà classé
    if (rider.rankingScratch || rider.comment) {
      throw new BadRequestException(
        `Impossible de classer le coureur au dossard ${rider.riderNumber}, il existe déjà dans le classement`,
      );
    }

    // Si on attribue un classement, vérifier si quelqu'un l'a déjà
    if (dto.rankingScratch) {
      const existingRanked = await this.raceRepository.findOne({
        where: {
          rankingScratch: dto.rankingScratch,
          raceCode: dto.raceCode,
          competitionId: dto.competitionId,
        },
      });

      // Si un coureur a déjà ce classement, on le retire
      if (existingRanked && existingRanked.id !== rider.id) {
        this.logger.debug(
          `Removing rank ${dto.rankingScratch} from rider ${existingRanked.riderNumber}`,
        );
        existingRanked.rankingScratch = null;
        existingRanked.comment = null;
        await this.raceRepository.save(existingRanked);
      }
    }

    // Mettre à jour le classement
    rider.rankingScratch = dto.rankingScratch || null;
    rider.comment = dto.comment || null;

    return this.raceRepository.save(rider);
  }

  /**
   * Retire un coureur du classement et réordonne les autres
   */
  async removeRanking(dto: RemoveRankingDto): Promise<void> {
    const race = await this.raceRepository.findOne({
      where: { id: dto.id },
    });

    if (!race) {
      return;
    }

    // Retirer le classement ou le commentaire
    if (race.comment) {
      race.comment = null;
    } else {
      race.rankingScratch = null;
    }
    race.chrono = null;
    race.sprintchallenge = false;

    await this.raceRepository.save(race);

    // Réordonner les classements de cette course pour combler les trous
    await this.reorderRankingsForRace(dto.competitionId, dto.raceCode);
  }

  /**
   * Réordonne les classements pour une course donnée
   */
  private async reorderRankingsForRace(
    competitionId: number,
    raceCode: string,
  ): Promise<void> {
    const races = await this.raceRepository.find({
      where: { competitionId, raceCode },
      order: { rankingScratch: 'ASC' },
    });

    const rankedRaces = races.filter((r) => r.rankingScratch && !r.comment);

    let newRank = 1;
    for (const race of rankedRaces) {
      if (race.rankingScratch !== newRank) {
        race.rankingScratch = newRank;
        await this.raceRepository.save(race);
      }
      newRank++;
    }
  }

  /**
   * Réordonne manuellement une liste de classements
   */
  async reorderRankings(items: ReorderRankingItemDto[]): Promise<void> {
    // Filtrer les items avec un ID et sans commentaire (pas ABD/DSQ)
    const validItems = items.filter((item) => item.id && !item.comment);

    for (let index = 0; index < validItems.length; index++) {
      const item = validItems[index];
      const newRank = index + 1;

      const race = await this.raceRepository.findOne({
        where: { id: item.id },
      });

      if (race && race.rankingScratch !== newRank && !race.comment) {
        race.rankingScratch = newRank;
        this.logger.debug(
          `Update ranking of rider ${race.riderNumber} to rank ${newRank}`,
        );
        await this.raceRepository.save(race);
      }
    }
  }

  /**
   * Supprime un engagement
   */
  async remove(id: number): Promise<void> {
    const race = await this.findOne(id);
    await this.raceRepository.remove(race);
  }

  /**
   * Supprime tous les engagements d'une compétition
   */
  async removeByCompetition(competitionId: number): Promise<void> {
    await this.raceRepository.delete({ competitionId });
  }

  /**
   * Crée plusieurs engagements en une fois
   */
  async createMany(racesData: Partial<RaceEntity>[]): Promise<RaceEntity[]> {
    const races = this.raceRepository.create(racesData);
    return this.raceRepository.save(races);
  }

  /**
   * Met à jour une race générique
   */
  async update(
    id: number,
    raceData: Partial<RaceEntity>,
  ): Promise<RaceEntity> {
    const race = await this.findOne(id);
    Object.assign(race, raceData);
    return this.raceRepository.save(race);
  }

  /**
   * Upload des résultats CSV pour une compétition
   * Format CSV attendu : Dossard;Chrono;Tours;Classement (séparateur ;)
   * Classement peut être un nombre ou un code : ABD, DSQ, NC, NP, CHT
   */
  async uploadResultsCsv(
    competitionId: number,
    file: Express.Multer.File,
  ): Promise<{ processed: number; errors: string[] }> {
    const VALID_COMMENTS = ['ABD', 'DSQ', 'NC', 'NP', 'CHT'];
    const results = this.parseCsvBuffer(file.buffer);
    const errors: string[] = [];

    // Vérifier la consécutivité des classements numériques
    for (let i = 0; i < results.length; i++) {
      const rank = parseInt(results[i].Classement, 10);
      if (!isNaN(rank) && rank !== i + 1) {
        throw new BadRequestException(
          `Le classement du Dossard ${results[i].Dossard} n'est pas consécutif : classement=${rank}, attendu=${i + 1}`,
        );
      }
    }

    // Traiter chaque ligne
    for (const row of results) {
      const race = await this.raceRepository.findOne({
        where: {
          riderNumber: parseInt(row.Dossard, 10),
          competitionId,
        },
      });

      if (!race) {
        errors.push(`Dossard ${row.Dossard} non trouvé`);
        continue;
      }

      race.chrono = row.Chrono || null;

      const tours = parseInt(row.Tours as unknown as string, 10);
      race.tours = isNaN(tours) ? null : tours;

      const rank = parseInt(row.Classement, 10);
      if (isNaN(rank)) {
        if (VALID_COMMENTS.includes(row.Classement)) {
          race.comment = row.Classement;
        } else {
          errors.push(
            `Dossard ${row.Dossard} : classement invalide "${row.Classement}"`,
          );
          continue;
        }
      } else {
        race.rankingScratch = rank;
      }

      await this.raceRepository.save(race);
    }

    return { processed: results.length, errors };
  }

  private parseCsvBuffer(
    buffer: Buffer,
  ): { Dossard: string; Chrono: string; Tours: string; Classement: string }[] {
    const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      throw new BadRequestException('Le fichier CSV est vide ou ne contient que l\'en-tête');
    }

    const headers = lines[0].split(';').map((h) => h.trim());
    const required = ['Dossard', 'Chrono', 'Tours', 'Classement'];
    for (const col of required) {
      if (!headers.includes(col)) {
        throw new BadRequestException(`Colonne manquante dans le CSV : ${col}`);
      }
    }

    return lines.slice(1).map((line) => {
      const values = line.split(';');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = (values[i] ?? '').trim()));
      return row as { Dossard: string; Chrono: string; Tours: string; Classement: string };
    });
  }

  /**
   * Met à jour les résultats en masse pour une compétition
   */
  async updateResults(
    competitionId: number,
    results: {
      licenceId: number;
      raceCode: string;
      rankingScratch: number;
      chrono?: string;
      tours?: number;
    }[],
  ): Promise<RaceEntity[]> {
    const updatedRaces: RaceEntity[] = [];

    for (const result of results) {
      const race = await this.raceRepository.findOne({
        where: {
          competitionId,
          licenceId: result.licenceId,
          raceCode: result.raceCode,
        },
      });

      if (race) {
        race.rankingScratch = result.rankingScratch;
        if (result.chrono) race.chrono = result.chrono;
        if (result.tours !== undefined) race.tours = result.tours;
        updatedRaces.push(await this.raceRepository.save(race));
      }
    }

    return updatedRaces;
  }
}
