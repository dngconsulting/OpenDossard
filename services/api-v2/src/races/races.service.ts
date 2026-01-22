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
  PalmaresRowDto,
  UpdateRankingDto,
  RemoveRankingDto,
  ReorderRankingItemDto,
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
   * Récupère le palmarès d'un coureur (toutes ses participations classées)
   */
  async getPalmares(licenceId: number): Promise<PalmaresRowDto[]> {
    const query = `
      SELECT
        r.id,
        r.race_code AS "raceCode",
        r.catev,
        r.catea,
        r.chrono,
        r.rider_dossard AS "riderNumber",
        NULLIF(
          (SELECT COUNT(*)
           FROM race rr
           JOIN licence ll ON rr.licence_id = ll.id
           WHERE rr.competition_id = r.competition_id
             AND rr.catev = r.catev
             AND rr.ranking_scratch <= r.ranking_scratch),
          0
        ) AS "rankingScratch",
        r.number_min AS "numberMin",
        r.number_max AS "numberMax",
        r.licence_id AS "licenceId",
        r.sprintchallenge,
        r.comment,
        r.competition_id AS "competitionId",
        CONCAT(l.name, ' ', l.first_name) AS "riderName",
        c.name AS "competitionName",
        c.event_date AS "competitionDate",
        c.competition_type AS "competitionType",
        c.races AS "competitionRaces",
        l.licence_number AS "licenceNumber",
        r.club,
        l.gender,
        c.fede,
        l.birth_year AS "birthYear"
      FROM race r
      JOIN licence l ON r.licence_id = l.id
      JOIN competition c ON r.competition_id = c.id
      WHERE r.licence_id = $1
        AND (r.comment IS NOT NULL OR r.ranking_scratch IS NOT NULL)
      ORDER BY c.event_date DESC, r.id DESC
    `;

    return this.dataSource.query(query, [licenceId]);
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
