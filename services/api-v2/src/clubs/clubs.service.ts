import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ClubEntity } from './entities/club.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { Federation } from '../common/enums';
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
  ) {}

  async findAll(fede?: Federation, dept?: string): Promise<ClubEntity[]> {
    const queryBuilder = this.clubRepository.createQueryBuilder('club');

    if (fede) {
      queryBuilder.andWhere('club.fede = :fede', { fede });
    }
    if (dept) {
      queryBuilder.andWhere('club.dept = :dept', { dept });
    }

    return queryBuilder.orderBy('club.longName', 'ASC').getMany();
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
    if (shortName) {
      qb.andWhere('club.shortName ILIKE :shortName', { shortName: `%${shortName}%` });
    }
    if (dept) {
      if (dept.includes(',')) {
        const deptsArray = dept.split(',').map(d => d.trim());
        qb.andWhere('club.dept IN (:...deptsArray)', { deptsArray });
      } else {
        qb.andWhere('club.dept ILIKE :dept', { dept: `%${dept}%` });
      }
    }
    if (fede) {
      if (fede.includes(',')) {
        const fedesArray = fede.split(',').map(f => f.trim());
        qb.andWhere('club.fede::text IN (:...fedesArray)', { fedesArray });
      } else {
        qb.andWhere('club.fede::text ILIKE :fede', { fede: `%${fede}%` });
      }
    }
    if (longName) {
      qb.andWhere('club.longName ILIKE :longName', { longName: `%${longName}%` });
    }
    if (elicenceName) {
      qb.andWhere('club.elicenceName ILIKE :elicenceName', { elicenceName: `%${elicenceName}%` });
    }

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

  async create(clubData: Partial<ClubEntity>, author?: string): Promise<ClubEntity> {
    const { id, ...data } = clubData;
    const club = this.clubRepository.create(data);
    const saved = await this.clubRepository.save(club);
    this.logger.log(
      `Création du club #${saved.id} par ${author ?? 'inconnu'} | ` +
        `${saved.longName} (${saved.shortName ?? '-'}) | Dept: ${saved.dept ?? '-'} | ` +
        `Fédé: ${saved.fede ?? '-'} | eLicence: ${saved.elicenceName ?? '-'}`,
    );
    return saved;
  }

  async update(
    id: number,
    dto: UpdateClubDto,
    author?: string,
  ): Promise<ClubEntity & { racesUpdated?: number; licencesUpdated?: number }> {
    const club = await this.findOne(id);

    // Propagate longName change to races/licences BEFORE updating the club
    let racesUpdated: number | undefined;
    let licencesUpdated: number | undefined;
    if (dto.propagate && dto.longName && dto.longName.trim() !== club.longName.trim()) {
      const result = await this.propagateName(club.longName, dto.longName);
      racesUpdated = result.racesUpdated;
      licencesUpdated = result.licencesUpdated;
    }

    if (dto.shortName !== undefined) club.shortName = dto.shortName;
    if (dto.longName !== undefined) club.longName = dto.longName;
    if (dto.elicenceName !== undefined) club.elicenceName = dto.elicenceName;
    if (dto.dept !== undefined) club.dept = dto.dept;

    const saved = await this.clubRepository.save(club);
    const fields = Object.keys(dto)
      .filter(k => k !== 'propagate' && (dto as Record<string, unknown>)[k] !== undefined)
      .map(k => `${k}: ${(dto as Record<string, unknown>)[k]}`)
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
  ): Promise<{ racesUpdated: number; licencesUpdated: number }> {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    const raceResult = await this.raceRepository
      .createQueryBuilder()
      .update(RaceEntity)
      .set({ club: trimmedNew })
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
}
