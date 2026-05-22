import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginatedResponseDto } from '../common/dto';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from '../helloasso/entities/helloasso-payment.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { FilterCompetitionDto } from './dto/filter-competition.dto';
import { ReorganizeCompetitionDto } from './dto/reorganize-competition.dto';
import { CompetitionEntity } from './entities/competition.entity';

const ACTIVE_PAYMENT_STATUSES: HelloAssoPaymentStatus[] = [
  HelloAssoPaymentStatus.PENDING,
  HelloAssoPaymentStatus.PAID,
  HelloAssoPaymentStatus.REFUNDING,
];

@Injectable()
export class CompetitionsService {
  private readonly logger = new Logger(CompetitionsService.name);

  constructor(
    @InjectRepository(CompetitionEntity)
    private competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(RaceEntity)
    private raceRepository: Repository<RaceEntity>,
    @InjectRepository(HelloAssoPaymentEntity)
    private helloAssoPaymentRepository: Repository<HelloAssoPaymentEntity>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findAll(
    filterDto: FilterCompetitionDto,
  ): Promise<
    PaginatedResponseDto<CompetitionEntity & { engagementsCount: number; classementsCount: number }>
  > {
    const {
      offset = 0,
      limit = 20,
      search,
      orderBy = 'eventDate',
      orderDirection = 'DESC',
      name,
      zipCode,
      fede,
      competitionType,
      dept,
      club,
      fedes,
      competitionTypes,
      depts,
      startDate,
      endDate,
      openedToOtherFede,
    } = filterDto;

    const queryBuilder = this.competitionRepository
      .createQueryBuilder('competition')
      .leftJoinAndSelect('competition.club', 'club')
      .addSelect(
        subQuery =>
          subQuery.select('COUNT(*)').from('race', 'r').where('r.competition_id = competition.id'),
        'engagementsCount',
      )
      .addSelect(
        subQuery =>
          subQuery
            .select('COUNT(*)')
            .from('race', 'r')
            .where('r.competition_id = competition.id')
            .andWhere('(r.ranking_scratch IS NOT NULL OR r.comment IS NOT NULL)'),
        'classementsCount',
      );

    // Global search
    if (search) {
      queryBuilder.andWhere(
        '(competition.name ILIKE :search OR competition.zipCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Column filters
    if (name) {
      queryBuilder.andWhere('competition.name ILIKE :name', { name: `%${name}%` });
    }
    if (zipCode) {
      queryBuilder.andWhere('competition.zipCode ILIKE :zipCode', { zipCode: `%${zipCode}%` });
    }
    if (fede) {
      queryBuilder.andWhere('competition.fede::text ILIKE :fede', { fede: `%${fede}%` });
    }
    if (competitionType) {
      queryBuilder.andWhere('competition.competition_type::text ILIKE :competitionType', {
        competitionType: `%${competitionType}%`,
      });
    }
    if (dept) {
      queryBuilder.andWhere('competition.dept ILIKE :dept', { dept: `%${dept}%` });
    }
    if (club) {
      queryBuilder.andWhere('club.longName ILIKE :club', { club: `%${club}%` });
    }

    // Advanced filters - multiple values
    if (fedes) {
      const fedesArray = fedes.split(',');
      queryBuilder.andWhere('competition.fede IN (:...fedesArray)', { fedesArray });
    }
    if (competitionTypes) {
      const typesArray = competitionTypes.split(',');
      queryBuilder.andWhere('competition.competition_type IN (:...typesArray)', { typesArray });
    }
    if (depts) {
      const deptsArray = depts.split(',');
      queryBuilder.andWhere('competition.dept IN (:...deptsArray)', { deptsArray });
    }

    // Access filters
    if (openedToOtherFede) {
      queryBuilder.andWhere('competition.opened_to_other_fede = TRUE');
    }

    // Date filters — comparaison au jour (inclusif des deux côtés) pour qu'une
    // épreuve du jour apparaisse à la fois dans "passé" et "futur".
    if (startDate) {
      queryBuilder.andWhere('DATE(competition.eventDate) >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('DATE(competition.eventDate) <= :endDate', { endDate });
    }

    // Ordering - TypeORM handles property to column mapping for orderBy
    const validOrderFields = ['eventDate', 'name', 'zipCode', 'fede', 'competitionType', 'dept'];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'eventDate';
    queryBuilder.orderBy(`competition.${orderField}`, orderDirection as 'ASC' | 'DESC');

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Pagination
    queryBuilder.skip(offset).take(limit);

    // Execute and map results
    const rawResults = await queryBuilder.getRawAndEntities();

    const rawRows = rawResults.raw as Array<{
      engagementsCount?: string;
      classementsCount?: string;
    }>;
    const data = rawResults.entities.map((entity, index) => ({
      ...entity,
      engagementsCount: parseInt(rawRows[index]?.engagementsCount || '0', 10),
      classementsCount: parseInt(rawRows[index]?.classementsCount || '0', 10),
    }));

    return new PaginatedResponseDto(data, total, offset, limit);
  }

  async findOne(id: number): Promise<CompetitionEntity> {
    const competition = await this.competitionRepository.findOne({
      where: { id },
      relations: ['club'],
    });
    if (!competition) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }
    return competition;
  }

  async create(
    competitionData: Partial<CompetitionEntity>,
    user: AuthenticatedUser,
  ): Promise<CompetitionEntity> {
    const { id: _id, ...data } = competitionData;
    void _id;

    // Scope check : un ORGANISATEUR ne peut créer une compet QUE pour un club
    // dont il est lié. ADMIN bypass. Une compet sans clubId = ADMIN only.
    await this.authorizationService.assertCompetitionAccess(user, {
      id: -1,
      clubId: data.clubId ?? null,
    });

    if (Array.isArray(data.photoUrls) && data.photoUrls.length === 0) {
      data.photoUrls = null;
    }
    const competition = this.competitionRepository.create(data);
    this.stampAudit(competition, user.email);
    const saved = await this.competitionRepository.save(competition);
    this.logger.log(
      `Création de la compétition #${saved.id} par ${user.email} | ` +
        `${saved.name ?? '-'} | Date: ${saved.eventDate ? new Date(saved.eventDate).toLocaleDateString('fr-FR') : '-'} | ` +
        `CP: ${saved.zipCode ?? '-'} | Dept: ${saved.dept ?? '-'} | ` +
        `Fédé: ${saved.fede} | Type: ${saved.competitionType} | ` +
        `Catégories: ${saved.categories ?? '-'} | Courses: ${saved.races ?? '-'}`,
    );
    return saved;
  }

  async update(
    id: number,
    competitionData: Partial<CompetitionEntity>,
    user: AuthenticatedUser,
  ): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);

    // Scope check sur le club actuel — l'utilisateur doit déjà être autorisé
    // à toucher cette compet AVANT d'envisager le moindre changement.
    await this.authorizationService.assertCompetitionAccess(user, competition);

    // Si on tente de RÉ-AFFECTER la compet à un autre club, deux contraintes :
    //  1. L'utilisateur doit aussi avoir accès au NOUVEAU club (bloque le
    //     scénario A1 de détournement de fonds : un ORGA qui transférerait
    //     une compet vers son propre club).
    //  2. Aucun `helloasso_payment` actif ne doit exister sur la compet :
    //     le checkout HelloAsso a été créé sur le slug du club d'origine,
    //     changer le club casserait la cohérence du flux paiement.
    if ('clubId' in competitionData && competitionData.clubId !== competition.clubId) {
      const newClubId = competitionData.clubId ?? null;
      await this.authorizationService.assertCompetitionAccess(user, { id, clubId: newClubId });

      const activePayments = await this.helloAssoPaymentRepository.count({
        where: { competitionId: id, status: In(ACTIVE_PAYMENT_STATUSES) },
      });
      if (activePayments > 0) {
        throw new UnprocessableEntityException(
          `Cette compétition a ${activePayments} paiement(s) actif(s) (pending/paid/refunding) — le club ne peut plus être modifié.`,
        );
      }
    }

    // Fix: Sync the club relation with clubId so TypeORM generates the correct FK value.
    // TypeORM prioritizes the relation object over the column, so we must align both.
    if ('clubId' in competitionData) {
      if (competitionData.clubId != null) {
        competition.club = { id: competitionData.clubId } as typeof competition.club;
      } else {
        competition.club = null as unknown as typeof competition.club;
      }
    }

    if (Array.isArray(competitionData.photoUrls) && competitionData.photoUrls.length === 0) {
      competitionData.photoUrls = null;
    }
    Object.assign(competition, competitionData);
    this.stampAudit(competition, user.email);
    const saved = await this.competitionRepository.save(competition);
    const fields = Object.keys(competitionData)
      .filter(
        k =>
          k !== 'id' &&
          k !== 'club' &&
          competitionData[k as keyof typeof competitionData] !== undefined,
      )
      .map(k => `${k}: ${JSON.stringify(competitionData[k as keyof typeof competitionData])}`)
      .join(' | ');
    this.logger.log(
      `Mise à jour de la compétition #${id} par ${user.email} | ${saved.name ?? '-'} | ${fields}`,
    );
    return saved;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const competition = await this.findOne(id);
    await this.authorizationService.assertCompetitionAccess(user, competition);
    await this.competitionRepository.remove(competition);
  }

  async duplicate(id: number, user: AuthenticatedUser): Promise<CompetitionEntity> {
    const original = await this.findOne(id);
    await this.authorizationService.assertCompetitionAccess(user, original);
    const { id: _, ...competitionData } = original;
    void _;
    const duplicate = this.competitionRepository.create({
      ...competitionData,
      name: `${original.name} (copie)`,
      resultsValidated: false,
    });
    this.stampAudit(duplicate, user.email);
    return this.competitionRepository.save(duplicate);
  }

  async validate(id: number, user: AuthenticatedUser): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);
    await this.authorizationService.assertCompetitionAccess(user, competition);
    competition.resultsValidated = true;
    this.stampAudit(competition, user.email);
    return this.competitionRepository.save(competition);
  }

  async reorganize(dto: ReorganizeCompetitionDto, user: AuthenticatedUser): Promise<void> {
    const competition = await this.findOne(dto.competitionId);
    await this.authorizationService.assertCompetitionAccess(user, competition);

    // Filter out empty races
    const cleanRaces = dto.races.filter(race => race.trim().length > 0);

    // Get all engagements for this competition
    const engagements = await this.raceRepository.find({
      where: { competitionId: dto.competitionId },
    });

    // Update raceCode for each engagement based on new races configuration
    const toSave: RaceEntity[] = [];
    for (const engagement of engagements) {
      if (!engagement.catev) continue;

      // Find the race that contains this engagement's catev
      const newRaceCode = cleanRaces.find(race =>
        race.split('/').includes(engagement.catev as string),
      );

      if (newRaceCode && newRaceCode !== engagement.raceCode) {
        engagement.raceCode = newRaceCode;
        toSave.push(engagement);
      }
    }

    if (toSave.length > 0) {
      toSave.forEach(r => this.stampAudit(r, user.email));
      await this.raceRepository.save(toSave);
    }

    // Update competition races (stored as comma-separated string)
    competition.races = cleanRaces.join(',');
    this.stampAudit(competition, user.email);
    await this.competitionRepository.save(competition);
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
