import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { PaginatedResponseDto } from '../common/dto';
import { CompetitionType } from '../common/enums';
import {
  CreateEngagementDto,
  FilterRaceDto,
  RaceRowDto,
} from './dto';

@Injectable()
export class RacesService {
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
