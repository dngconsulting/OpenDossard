import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { ClubEntity } from './entities/club.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { HelloAssoDetailsEntity } from '../helloasso/entities/helloasso-details.entity';
import { UserClubEntity } from '../auth/entities/user-club.entity';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role, Federation } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { FilterClubDto } from './dto/filter-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    @InjectRepository(ClubEntity)
    private clubRepository: Repository<ClubEntity>,
    @InjectRepository(LicenceEntity)
    private licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(RaceEntity)
    private raceRepository: Repository<RaceEntity>,
    @InjectRepository(CompetitionEntity)
    private competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(HelloAssoDetailsEntity)
    private helloAssoDetailsRepository: Repository<HelloAssoDetailsEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Refuse toute édition/suppression d'un club qui possède une liaison HelloAsso.
   * Pour reprendre la main, l'admin doit d'abord délier (DELETE /helloasso/clubs/:id).
   * Évite notamment qu'un rename de `elicenceName` casse le slug HelloAsso et
   * laisse une ligne `helloasso_details` orpheline.
   */
  private async assertNotLinkedToHelloAsso(
    clubId: number,
    action: 'update' | 'remove',
  ): Promise<void> {
    const linked = await this.helloAssoDetailsRepository.findOne({ where: { clubId } });
    if (linked) {
      throw new ConflictException(
        `Ce club est lié à HelloAsso (${linked.organizationSlug}). Délier d'abord pour ${action === 'update' ? 'modifier' : 'supprimer'}.`,
      );
    }
  }

  async findAll(fede?: Federation, dept?: string | string[]): Promise<ClubEntity[]> {
    const queryBuilder = this.clubRepository.createQueryBuilder('club');

    if (fede) {
      queryBuilder.andWhere('club.fede = :fede', { fede });
    }
    if (dept !== undefined) {
      const depts = (Array.isArray(dept) ? dept : [dept]).filter(d => d.length > 0);
      if (depts.length > 0) {
        queryBuilder.andWhere('club.dept IN (:...depts)', { depts });
      }
    }

    return queryBuilder.orderBy('club.longName', 'ASC').getMany();
  }

  /**
   * Lookup batch par IDs. Retourne triés alphabétiquement sur `longName`.
   * Une liste vide renvoie `[]` sans toucher la DB.
   */
  async findByIds(ids: number[]): Promise<ClubEntity[]> {
    if (ids.length === 0) return [];
    return this.clubRepository
      .createQueryBuilder('club')
      .where('club.id IN (:...ids)', { ids })
      .orderBy('club.longName', 'ASC')
      .getMany();
  }

  async findAllPaginated(filterDto: FilterClubDto): Promise<PaginatedResponseDto<ClubEntity>> {
    const { offset = 0, limit = 20 } = filterDto;
    const qb = this.buildFilteredQuery(filterDto);
    qb.skip(offset).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, offset, limit);
  }

  async findForExport(filterDto: FilterClubDto): Promise<ClubEntity[]> {
    const qb = this.buildFilteredQuery(filterDto);
    return qb.take(1500).getMany();
  }

  private applyFilter(
    qb: SelectQueryBuilder<ClubEntity>,
    field: string,
    value: string,
    options?: { multiValue?: boolean; cast?: string },
  ): void {
    const col = options?.cast ? `club.${field}::${options.cast}` : `club.${field}`;
    if (value === '__empty__') {
      const emptyCol = options?.cast ? `club.${field}::${options.cast}` : `club.${field}`;
      qb.andWhere(`(${emptyCol} IS NULL OR ${emptyCol} = '')`);
    } else if (options?.multiValue && value.includes(',')) {
      const values = value.split(',').map(v => v.trim());
      qb.andWhere(`${col} IN (:...${field}Array)`, { [`${field}Array`]: values });
    } else {
      qb.andWhere(`${col} ILIKE :${field}`, { [field]: `%${value}%` });
    }
  }

  private buildFilteredQuery(filterDto: FilterClubDto): SelectQueryBuilder<ClubEntity> {
    const {
      search,
      orderBy = 'shortName',
      orderDirection = 'ASC',
      shortName,
      dept,
      fede,
      longName,
      elicenceName,
    } = filterDto;

    const qb = this.clubRepository.createQueryBuilder('club');

    if (search) {
      qb.andWhere(
        '(LOWER(club.shortName) LIKE LOWER(:search) OR LOWER(club.longName) LIKE LOWER(:search) OR LOWER(club.elicenceName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Column-level filters
    if (shortName) this.applyFilter(qb, 'shortName', shortName);
    if (dept) this.applyFilter(qb, 'dept', dept, { multiValue: true });
    if (fede) this.applyFilter(qb, 'fede', fede, { multiValue: true, cast: 'text' });
    if (longName) this.applyFilter(qb, 'longName', longName);
    if (elicenceName) this.applyFilter(qb, 'elicenceName', elicenceName);

    const validOrderFields = ['id', 'shortName', 'longName', 'dept', 'fede', 'elicenceName'];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'shortName';
    qb.orderBy(`club.${orderField}`, orderDirection as 'ASC' | 'DESC');

    if (orderField !== 'shortName') {
      qb.addOrderBy('club.shortName', 'ASC');
    }

    return qb;
  }

  async findOne(id: number): Promise<ClubEntity> {
    const club = await this.clubRepository.findOne({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }
    return club;
  }

  /**
   * Variante non-throwing de `findOne` : renvoie `null` si le club n'existe pas.
   * Utilisée par le callback HelloAsso pour distinguer "club absent" (cas
   * exceptionnel : la ligne a disparu entre `authorize` et le callback) du
   * cas "club présent mais slug HelloAsso non/mal renseigné".
   */
  async findById(id: number): Promise<ClubEntity | null> {
    return this.clubRepository.findOne({ where: { id } });
  }

  /**
   * Crée un club. Si le créateur est un ORGANISATEUR non-ADMIN, l'ajoute
   * automatiquement à `user_club` dans la même transaction : sans ça il ne
   * pourrait plus éditer le club qu'il vient de créer (PATCH/DELETE sont
   * scopés via `assertClubAccess`).
   *
   * Cette auto-liaison reflète le workflow réel : un ORGA crée un club à la
   * volée pendant la saisie d'une licence (nom + dept). L'ADMIN n'est jamais
   * lié explicitement (il bypass déjà via `Role.ADMIN`).
   *
   * Si l'insert `user_club` échoue, le `INSERT clubs` est rollback — on évite
   * un club orphelin qu'aucun ORGA ne pourrait éditer.
   */
  async create(
    clubData: Partial<ClubEntity>,
    currentUser?: AuthenticatedUser,
  ): Promise<ClubEntity> {
    const { id: _id, ...data } = clubData;
    void _id;

    if (data.longName) {
      const qb = this.clubRepository
        .createQueryBuilder('club')
        .where('LOWER(TRIM(club.longName)) = LOWER(TRIM(:longName))', { longName: data.longName });
      if (data.fede) {
        qb.andWhere('club.fede = :fede', { fede: data.fede });
      }
      const existing = await qb.getOne();
      if (existing) {
        throw new ConflictException('Ce club existe déjà pour cette fédération');
      }
    }

    const shouldAutoLink =
      currentUser !== undefined &&
      currentUser.roles.includes(Role.ORGANISATEUR) &&
      !currentUser.roles.includes(Role.ADMIN);

    const saved = await this.dataSource.transaction(async manager => {
      const club = manager.create(ClubEntity, data);
      this.stampAudit(club, currentUser?.email);
      const persisted = await manager.save(ClubEntity, club);
      if (shouldAutoLink) {
        await manager.save(UserClubEntity, {
          userId: currentUser.id,
          clubId: persisted.id,
        });
      }
      return persisted;
    });

    this.logger.log(
      `Création du club #${saved.id} par ${currentUser?.email ?? 'inconnu'} | ` +
        `${saved.longName} (${saved.shortName ?? '-'}) | Dept: ${saved.dept ?? '-'} | ` +
        `Fédé: ${saved.fede ?? '-'} | eLicence: ${saved.elicenceName ?? '-'}` +
        (shouldAutoLink ? ` | auto-link user #${currentUser.id}` : ''),
    );
    return saved;
  }

  async update(
    id: number,
    dto: UpdateClubDto,
    author?: string,
  ): Promise<ClubEntity & { racesUpdated?: number; licencesUpdated?: number }> {
    const club = await this.findOne(id);
    await this.assertNotLinkedToHelloAsso(id, 'update');

    // Propagate longName change to races/licences BEFORE updating the club
    let racesUpdated: number | undefined;
    let licencesUpdated: number | undefined;
    if (dto.propagate && dto.longName && dto.longName.trim() !== club.longName.trim()) {
      const result = await this.propagateName(club.longName, dto.longName, author);
      racesUpdated = result.racesUpdated;
      licencesUpdated = result.licencesUpdated;
    }

    if (dto.shortName !== undefined) club.shortName = dto.shortName;
    if (dto.longName !== undefined) club.longName = dto.longName;
    if (dto.elicenceName !== undefined) club.elicenceName = dto.elicenceName;
    if (dto.dept !== undefined) club.dept = dto.dept;
    if (dto.helloAssoSlug !== undefined) {
      club.helloAssoSlug = dto.helloAssoSlug?.trim() ? dto.helloAssoSlug.trim() : null;
    }

    this.stampAudit(club, author);
    const saved = await this.clubRepository.save(club);
    const fields = Object.keys(dto)
      .filter(k => k !== 'propagate' && (dto as Record<string, unknown>)[k] !== undefined)
      .map(k => `${k}: ${String((dto as Record<string, unknown>)[k])}`)
      .join(' | ');
    this.logger.log(
      `Mise à jour du club #${id} par ${author ?? 'inconnu'} | ${saved.longName} | ${fields}`,
    );
    return { ...saved, racesUpdated, licencesUpdated };
  }

  async countReferences(
    id: number,
  ): Promise<{ raceCount: number; licenceCount: number; competitionCount: number }> {
    const club = await this.findOne(id);
    const longName = club.longName.trim();

    // Run all 3 independent count queries in parallel
    const [raceCount, licenceCount, competitionCount] = await Promise.all([
      this.raceRepository
        .createQueryBuilder('race')
        .where('TRIM(race.club) = :longName', { longName })
        .getCount(),
      this.licenceRepository
        .createQueryBuilder('licence')
        .where('TRIM(licence.club) = :longName', { longName })
        .getCount(),
      this.competitionRepository
        .createQueryBuilder('competition')
        .where('competition.clubId = :id', { id })
        .getCount(),
    ]);

    return { raceCount, licenceCount, competitionCount };
  }

  async remove(id: number): Promise<void> {
    const club = await this.findOne(id);
    await this.assertNotLinkedToHelloAsso(id, 'remove');
    const { raceCount, licenceCount, competitionCount } = await this.countReferences(id);

    const errors: string[] = [];
    if (raceCount > 0) errors.push(`${raceCount} participation(s)`);
    if (licenceCount > 0) errors.push(`${licenceCount} licence(s)`);
    if (competitionCount > 0) errors.push(`${competitionCount} compétition(s)`);

    if (errors.length > 0) {
      throw new ConflictException(
        `Impossible de supprimer le club "${club.longName}" : référencé dans ${errors.join(', ')}`,
      );
    }

    await this.clubRepository.remove(club);
  }

  private async propagateName(
    oldName: string,
    newName: string,
    author?: string,
  ): Promise<{ racesUpdated: number; licencesUpdated: number }> {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    const raceSetValues: QueryDeepPartialEntity<RaceEntity> = {
      club: trimmedNew,
      lastChanged: () => 'CURRENT_TIMESTAMP',
    };
    if (author !== undefined) {
      raceSetValues.author = author;
    }
    const raceResult = await this.raceRepository
      .createQueryBuilder()
      .update(RaceEntity)
      .set(raceSetValues)
      .where('TRIM(club) = :oldName', { oldName: trimmedOld })
      .execute();

    const licenceResult = await this.licenceRepository
      .createQueryBuilder()
      .update(LicenceEntity)
      .set({ club: trimmedNew })
      .where('TRIM(club) = :oldName', { oldName: trimmedOld })
      .execute();

    return {
      racesUpdated: raceResult.affected ?? 0,
      licencesUpdated: licenceResult.affected ?? 0,
    };
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
