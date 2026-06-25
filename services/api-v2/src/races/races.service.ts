import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { PaginatedResponseDto } from '../common/dto';
import { CompetitionType } from '../common/enums';
import { CreateEngagementDto, FilterRaceDto, RaceRowDto } from './dto';

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
  async engage(dto: CreateEngagementDto, author?: string): Promise<RaceEntity> {
    // Run all 4 validation queries in parallel
    const [licence, competition, numberConflict, licenceConflict] = await Promise.all([
      this.licenceRepository.findOne({
        where: { id: dto.licenceId },
      }),
      this.competitionRepository.findOne({
        where: { id: dto.competitionId },
      }),
      this.raceRepository.findOne({
        where: {
          competitionId: dto.competitionId,
          riderNumber: dto.riderNumber,
          raceCode: dto.raceCode,
        },
      }),
      this.raceRepository.findOne({
        where: {
          competitionId: dto.competitionId,
          licenceId: dto.licenceId,
          raceCode: dto.raceCode,
        },
      }),
    ]);

    if (!licence) {
      throw new BadRequestException('Licence inconnue');
    }
    if (!competition) {
      throw new BadRequestException('Compétition inconnue');
    }
    if (numberConflict) {
      throw new BadRequestException(`Le numéro de dossard ${dto.riderNumber} est déjà pris`);
    }
    if (licenceConflict) {
      throw new BadRequestException('Ce licencié est déjà inscrit sur cette épreuve');
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
    this.stampAudit(race, author);

    const saved = await this.raceRepository.save(race);
    this.logger.log(
      `Création de l'engagement #${saved.id} par ${author ?? 'inconnu'} | ` +
        `Compétition: ${dto.competitionId} | Licence: ${dto.licenceId} | ` +
        `Dossard: ${dto.riderNumber} | Course: ${dto.raceCode ?? '-'} | ` +
        `CatéV: ${dto.catev ?? '-'} | CatéA: ${saved.catea ?? '-'} | Club: ${saved.club ?? '-'}`,
    );
    return saved;
  }

  /**
   * Rafraîchit l'engagement depuis les données de la licence
   */
  async refreshEngagement(
    licenceId: number,
    competitionId: number,
    author?: string,
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
    this.stampAudit(race, author);

    return this.raceRepository.save(race);
  }

  /**
   * Toggle le flag sprint challenge
   */
  async toggleSprintChallenge(id: number, author?: string): Promise<RaceEntity> {
    const race = await this.findOne(id);
    race.sprintchallenge = !race.sprintchallenge;
    this.stampAudit(race, author);
    return this.raceRepository.save(race);
  }

  /**
   * Met à jour le chrono d'un coureur
   */
  async updateChrono(id: number, chrono: string, author?: string): Promise<RaceEntity> {
    const race = await this.findOne(id);
    race.chrono = chrono;
    this.stampAudit(race, author);
    return this.raceRepository.save(race);
  }

  /**
   * Met à jour le nombre de tours d'un coureur
   */
  async updateTours(id: number, tours: number | null, author?: string): Promise<RaceEntity> {
    const race = await this.findOne(id);
    race.tours = tours;
    this.stampAudit(race, author);
    return this.raceRepository.save(race);
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
   * Désengage en masse plusieurs coureurs. La suppression passe par un unique
   * `DELETE ... WHERE id IN (...)` : opération atomique (tout ou rien), bornée
   * à la compétition fournie par sécurité. Retourne le nombre de lignes supprimées.
   */
  async removeMany(ids: number[], competitionId: number): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await this.raceRepository.delete({ id: In(ids), competitionId });
    return result.affected ?? 0;
  }

  /**
   * Crée plusieurs engagements en une fois
   */
  async createMany(racesData: Partial<RaceEntity>[], author?: string): Promise<RaceEntity[]> {
    const races = this.raceRepository.create(racesData);
    races.forEach(r => this.stampAudit(r, author));
    return this.raceRepository.save(races);
  }

  /**
   * Met à jour une race générique
   */
  async update(id: number, raceData: Partial<RaceEntity>, author?: string): Promise<RaceEntity> {
    const race = await this.findOne(id);
    Object.assign(race, raceData);
    this.stampAudit(race, author);
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
    author?: string,
  ): Promise<RaceEntity[]> {
    // Fetch all races for this competition in ONE query
    const allRaces = await this.raceRepository.find({
      where: { competitionId },
    });

    // Build a Map for O(1) lookup by licenceId+raceCode
    const raceMap = new Map<string, RaceEntity>();
    for (const race of allRaces) {
      raceMap.set(`${race.licenceId}_${race.raceCode}`, race);
    }

    // Apply updates in memory
    const toSave: RaceEntity[] = [];
    for (const result of results) {
      const race = raceMap.get(`${result.licenceId}_${result.raceCode}`);
      if (race) {
        race.rankingScratch = result.rankingScratch;
        if (result.chrono) race.chrono = result.chrono;
        if (result.tours !== undefined) race.tours = result.tours;
        this.stampAudit(race, author);
        toSave.push(race);
      }
    }

    // Batch save
    return this.raceRepository.save(toSave);
  }

  /**
   * Écrase systématiquement `author` et `lastChanged` avant `.save()`. Ne fait
   * AUCUNE confiance aux valeurs entrantes : le body n'est jamais autoritatif
   * sur ces deux champs — la source de vérité est le JWT (ou `null` pour les
   * contextes sans utilisateur identifié).
   */
  private stampAudit<T extends { author?: string | null; lastChanged?: Date | null }>(
    entity: T,
    author: string | undefined,
  ): T {
    entity.author = author ?? null;
    entity.lastChanged = new Date();
    return entity;
  }
}
