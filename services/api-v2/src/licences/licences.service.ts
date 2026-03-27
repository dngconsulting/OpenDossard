import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { LicenceEntity } from './entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CreateLicenceDto, FilterLicenceDto, UpdateLicenceDto } from './dto';
import { PaginatedResponseDto } from '../common/dto';

@Injectable()
export class LicencesService {
  private readonly logger = new Logger(LicencesService.name);

  constructor(
    @InjectRepository(LicenceEntity)
    private licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(RaceEntity)
    private raceRepository: Repository<RaceEntity>,
  ) {}

  private applyFilter(
    qb: SelectQueryBuilder<LicenceEntity>,
    field: string,
    value: string,
    options?: { multiValue?: boolean; cast?: string },
  ): void {
    const col = options?.cast ? `licence.${field}::${options.cast}` : `licence.${field}`;
    if (value === '__empty__') {
      const emptyCol = options?.cast ? `licence.${field}::${options.cast}` : `licence.${field}`;
      qb.andWhere(`(${emptyCol} IS NULL OR ${emptyCol} = '')`);
    } else if (options?.multiValue && value.includes(',')) {
      const values = value.split(',').map(v => v.trim());
      qb.andWhere(`${col} IN (:...${field}Array)`, { [`${field}Array`]: values });
    } else {
      qb.andWhere(`${col} ILIKE :${field}`, { [field]: `%${value}%` });
    }
  }

  private buildFilteredQuery(filterDto: FilterLicenceDto): SelectQueryBuilder<LicenceEntity> {
    const {
      search,
      orderBy = 'name',
      orderDirection = 'ASC',
      id,
      name,
      firstName,
      licenceNumber,
      club,
      dept,
      fede,
      gender,
      birthYear,
      catea,
      catev,
      catevCX,
      saison,
      withoutNumber,
    } = filterDto;

    const queryBuilder = this.licenceRepository.createQueryBuilder('licence');

    // Global search — split into tokens for multi-word queries
    if (search) {
      this.applySearchTokens(queryBuilder, search);
    }

    // Specific filters - all combined with AND
    if (id) {
      queryBuilder.andWhere('licence.id = :id', { id });
    }
    if (name) this.applyFilter(queryBuilder, 'name', name);
    if (firstName) this.applyFilter(queryBuilder, 'firstName', firstName);
    if (licenceNumber) this.applyFilter(queryBuilder, 'licenceNumber', licenceNumber);
    if (club) this.applyFilter(queryBuilder, 'club', club);
    if (dept) this.applyFilter(queryBuilder, 'dept', dept, { multiValue: true });
    if (fede) this.applyFilter(queryBuilder, 'fede', fede, { cast: 'text' });
    if (gender) this.applyFilter(queryBuilder, 'gender', gender);
    if (birthYear) this.applyFilter(queryBuilder, 'birthYear', birthYear);
    if (catea) this.applyFilter(queryBuilder, 'catea', catea);
    if (catev) this.applyFilter(queryBuilder, 'catev', catev);
    if (catevCX) this.applyFilter(queryBuilder, 'catevCX', catevCX);
    if (saison) this.applyFilter(queryBuilder, 'saison', saison);
    if (withoutNumber) {
      queryBuilder.andWhere('(licence.licenceNumber IS NULL OR licence.licenceNumber = :empty)', {
        empty: '',
      });
    }

    // Ordering
    const validOrderFields = [
      'id',
      'name',
      'firstName',
      'licenceNumber',
      'club',
      'dept',
      'fede',
      'gender',
      'birthYear',
      'catea',
      'catev',
      'catevCX',
      'saison',
    ];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'name';
    if (orderBy === 'racesCount') {
      queryBuilder.orderBy(
        '(SELECT COUNT(*) FROM race WHERE race.licence_id = licence.id)',
        orderDirection as 'ASC' | 'DESC',
      );
    } else {
      queryBuilder.orderBy(`licence.${orderField}`, orderDirection as 'ASC' | 'DESC');
    }

    return queryBuilder;
  }

  async findAll(filterDto: FilterLicenceDto): Promise<PaginatedResponseDto<LicenceEntity>> {
    const { offset = 0, limit = 20 } = filterDto;

    const queryBuilder = this.buildFilteredQuery(filterDto);

    // Add races count as a correlated subquery
    queryBuilder.addSelect(
      '(SELECT COUNT(*) FROM race WHERE race.licence_id = licence.id)',
      'racesCount',
    );

    // Pagination with offset/limit
    queryBuilder.skip(offset).take(limit);

    const { raw, entities } = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    const rawByIndex = new Map<number, { racesCount?: string | number }>(
      raw.map((r: { racesCount?: string | number }, i: number) => [i, r]),
    );
    const data = entities.map((entity, i) => ({
      ...entity,
      racesCount: Number(rawByIndex.get(i)?.racesCount ?? 0),
    }));

    return new PaginatedResponseDto(data, total, offset, limit);
  }

  async findForExport(filterDto: FilterLicenceDto): Promise<LicenceEntity[]> {
    const queryBuilder = this.buildFilteredQuery(filterDto);
    return queryBuilder.take(1500).getMany();
  }

  async findOne(id: number): Promise<LicenceEntity> {
    const licence = await this.licenceRepository.findOne({ where: { id } });
    if (!licence) {
      throw new NotFoundException(`Licence with ID ${id} not found`);
    }
    return licence;
  }

  async search(query: string, _competitionType?: string): Promise<LicenceEntity[]> {
    const qb = this.licenceRepository.createQueryBuilder('licence');

    this.applySearchTokens(qb, query);

    return qb.orderBy('licence.name', 'ASC').take(20).getMany();
  }

  /**
   * Apply accent-insensitive search tokens to a query builder.
   * Single token: prefix match on name/firstName + substring on licenceNumber/club.
   * Multiple tokens: each must match start of name OR firstName (AND between tokens).
   */
  private applySearchTokens(
    qb: SelectQueryBuilder<LicenceEntity>,
    searchTerm: string,
  ): void {
    const tokens = searchTerm.trim().split(/\s+/).filter(Boolean);

    // Compact form: search term without spaces (e.g. "DEMARCHI" for "DE MARCHI")
    const compactTerm = tokens.join('');

    if (tokens.length === 1) {
      qb.andWhere(
        `(unaccent(licence.name) ILIKE unaccent(:sToken) OR unaccent(licence.firstName) ILIKE unaccent(:sToken) OR licence.licenceNumber ILIKE :sSubstr OR licence.club ILIKE :sSubstr OR REPLACE(unaccent(licence.name), ' ', '') ILIKE unaccent(:sCompact) OR REPLACE(unaccent(licence.firstName), ' ', '') ILIKE unaccent(:sCompact))`,
        { sToken: `${tokens[0]}%`, sSubstr: `%${tokens[0]}%`, sCompact: `${compactTerm}%` },
      );
    } else {
      qb.andWhere(
        new Brackets(sub => {
          // Branch 1: each token must be found as substring in name or firstName
          sub.where(
            new Brackets(tokenSub => {
              tokens.forEach((token, i) => {
                tokenSub.andWhere(
                  `(unaccent(licence.name) ILIKE unaccent(:sToken${i}) OR unaccent(licence.firstName) ILIKE unaccent(:sToken${i}) OR REPLACE(unaccent(licence.name), ' ', '') ILIKE unaccent(:sToken${i}) OR REPLACE(unaccent(licence.firstName), ' ', '') ILIKE unaccent(:sToken${i}))`,
                  { [`sToken${i}`]: `%${token}%` },
                );
              });
            }),
          );
          // Branch 2: compact form against space-stripped name or firstName
          sub.orWhere(
            `(REPLACE(unaccent(licence.name), ' ', '') ILIKE unaccent(:sCompact) OR REPLACE(unaccent(licence.firstName), ' ', '') ILIKE unaccent(:sCompact))`,
            { sCompact: `${compactTerm}%` },
          );
        }),
      );
    }
  }

  async create(createLicenceDto: CreateLicenceDto, author?: string): Promise<LicenceEntity> {
    const licence = this.licenceRepository.create({
      ...createLicenceDto,
      author,
      lastChanged: new Date(),
    });
    const saved = await this.licenceRepository.save(licence);
    this.logger.log(
      `Création de la licence #${saved.id} par ${author ?? 'inconnu'} | ` +
        `${saved.name} ${saved.firstName} | N°${saved.licenceNumber ?? '-'} | ` +
        `Club: ${saved.club ?? '-'} | Dept: ${saved.dept ?? '-'} | Fédé: ${saved.fede} | ` +
        `Genre: ${saved.gender ?? '-'} | Année: ${saved.birthYear ?? '-'} | ` +
        `CatéA: ${saved.catea ?? '-'} | CatéV: ${saved.catev ?? '-'} | CatéVCX: ${saved.catevCX ?? '-'} | ` +
        `Saison: ${saved.saison ?? '-'}`,
    );
    return saved;
  }

  async update(
    id: number,
    updateLicenceDto: UpdateLicenceDto,
    author?: string,
  ): Promise<LicenceEntity> {
    const licence = await this.findOne(id);

    Object.assign(licence, {
      ...updateLicenceDto,
      author,
      lastChanged: new Date(),
    });

    const saved = await this.licenceRepository.save(licence);
    const fields = Object.keys(updateLicenceDto)
      .filter(k => (updateLicenceDto as Record<string, unknown>)[k] !== undefined)
      .map(k => `${k}: ${(updateLicenceDto as Record<string, unknown>)[k]}`)
      .join(' | ');
    this.logger.log(
      `Mise à jour de la licence #${id} par ${author ?? 'inconnu'} | ` +
        `${saved.name} ${saved.firstName} | ${fields}`,
    );
    return saved;
  }

  async remove(id: number): Promise<void> {
    const licence = await this.findOne(id);
    const raceCount = await this.raceRepository.count({ where: { licenceId: id } });
    if (raceCount > 0) {
      throw new ConflictException('Ce licencié a déjà participé à une épreuve, il ne peut être supprimé');
    }
    await this.licenceRepository.remove(licence);
  }
}
