import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { LicenceEntity } from './entities/licence.entity';
import { CreateLicenceDto, FilterLicenceDto, UpdateLicenceDto } from './dto';
import { PaginatedResponseDto } from '../common/dto';

@Injectable()
export class LicencesService {
  constructor(
    @InjectRepository(LicenceEntity)
    private licenceRepository: Repository<LicenceEntity>,
  ) {}

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
    // "J Miquel" → token "J" matches start of name/firstName, "Miquel" matches start of name/firstName
    // Supports accent-insensitive matching and name/firstName inversion
    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);

      if (tokens.length === 1) {
        // Single token: prefix match on name/firstName + substring on licenceNumber/club
        queryBuilder.andWhere(
          `(unaccent(licence.name) ILIKE unaccent(:sToken) OR unaccent(licence.firstName) ILIKE unaccent(:sToken) OR licence.licenceNumber ILIKE :sSubstr OR licence.club ILIKE :sSubstr)`,
          { sToken: `${tokens[0]}%`, sSubstr: `%${tokens[0]}%` },
        );
      } else {
        // Multiple tokens: each must match start of name OR firstName (AND between tokens)
        tokens.forEach((token, i) => {
          queryBuilder.andWhere(
            `(unaccent(licence.name) ILIKE unaccent(:sToken${i}) OR unaccent(licence.firstName) ILIKE unaccent(:sToken${i}))`,
            { [`sToken${i}`]: `${token}%` },
          );
        });
      }
    }

    // Specific filters - all combined with AND
    if (id) {
      queryBuilder.andWhere('licence.id = :id', { id });
    }
    if (name) {
      queryBuilder.andWhere('licence.name ILIKE :name', { name: `%${name}%` });
    }
    if (firstName) {
      queryBuilder.andWhere('licence.firstName ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }
    if (licenceNumber) {
      queryBuilder.andWhere('licence.licenceNumber ILIKE :licenceNumber', {
        licenceNumber: `%${licenceNumber}%`,
      });
    }
    if (club) {
      queryBuilder.andWhere('licence.club ILIKE :club', { club: `%${club}%` });
    }
    if (dept) {
      queryBuilder.andWhere('licence.dept ILIKE :dept', { dept: `%${dept}%` });
    }
    if (fede) {
      queryBuilder.andWhere('licence.fede::text ILIKE :fede', { fede: `%${fede}%` });
    }
    if (gender) {
      queryBuilder.andWhere('licence.gender ILIKE :gender', { gender: `%${gender}%` });
    }
    if (birthYear) {
      queryBuilder.andWhere('licence.birthYear ILIKE :birthYear', { birthYear: `%${birthYear}%` });
    }
    if (catea) {
      queryBuilder.andWhere('licence.catea ILIKE :catea', { catea: `%${catea}%` });
    }
    if (catev) {
      queryBuilder.andWhere('licence.catev ILIKE :catev', { catev: `%${catev}%` });
    }
    if (catevCX) {
      queryBuilder.andWhere('licence.catevCX ILIKE :catevCX', { catevCX: `%${catevCX}%` });
    }
    if (saison) {
      queryBuilder.andWhere('licence.saison ILIKE :saison', { saison: `%${saison}%` });
    }
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
    const tokens = query.trim().split(/\s+/).filter(Boolean);

    if (tokens.length === 1) {
      qb.where(
        `(unaccent(licence.name) ILIKE unaccent(:sToken) OR unaccent(licence.firstName) ILIKE unaccent(:sToken) OR licence.licenceNumber ILIKE :sSubstr)`,
        { sToken: `${tokens[0]}%`, sSubstr: `%${tokens[0]}%` },
      );
    } else {
      tokens.forEach((token, i) => {
        qb.andWhere(
          `(unaccent(licence.name) ILIKE unaccent(:sToken${i}) OR unaccent(licence.firstName) ILIKE unaccent(:sToken${i}))`,
          { [`sToken${i}`]: `${token}%` },
        );
      });
    }

    return qb.orderBy('licence.name', 'ASC').take(20).getMany();
  }

  async create(createLicenceDto: CreateLicenceDto, author?: string): Promise<LicenceEntity> {
    const licence = this.licenceRepository.create({
      ...createLicenceDto,
      author,
      lastChanged: new Date(),
    });
    return this.licenceRepository.save(licence);
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

    return this.licenceRepository.save(licence);
  }

  async remove(id: number): Promise<void> {
    const licence = await this.findOne(id);
    await this.licenceRepository.remove(licence);
  }
}
