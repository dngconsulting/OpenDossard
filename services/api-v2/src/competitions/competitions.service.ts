import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitionEntity } from './entities/competition.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { PaginatedResponseDto } from '../common/dto';
import { FilterCompetitionDto } from './dto/filter-competition.dto';
import { ReorganizeCompetitionDto } from './dto/reorganize-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(RaceEntity)
    private raceRepository: Repository<RaceEntity>,
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
    } = filterDto;

    const queryBuilder = this.competitionRepository
      .createQueryBuilder('competition')
      .leftJoinAndSelect('competition.club', 'club')
      // Sous-requête pour compter les engagements
      .addSelect(
        subQuery =>
          subQuery.select('COUNT(*)').from('race', 'r').where('r.competition_id = competition.id'),
        'engagementsCount',
      )
      // Sous-requête pour compter les classements (avec ranking_scratch non null)
      .addSelect(
        subQuery =>
          subQuery
            .select('COUNT(*)')
            .from('race', 'r')
            .where('r.competition_id = competition.id')
            .andWhere('r.ranking_scratch IS NOT NULL'),
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

    // Date filters
    if (startDate) {
      queryBuilder.andWhere('competition.eventDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('competition.eventDate <= :endDate', { endDate });
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

    const data = rawResults.entities.map((entity, index) => ({
      ...entity,
      engagementsCount: parseInt(rawResults.raw[index]?.engagementsCount || '0', 10),
      classementsCount: parseInt(rawResults.raw[index]?.classementsCount || '0', 10),
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

  async create(competitionData: Partial<CompetitionEntity>): Promise<CompetitionEntity> {
    const competition = this.competitionRepository.create(competitionData);
    return this.competitionRepository.save(competition);
  }

  async update(
    id: number,
    competitionData: Partial<CompetitionEntity>,
  ): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);

    // Fix: Sync the club relation with clubId so TypeORM generates the correct FK value.
    // TypeORM prioritizes the relation object over the column, so we must align both.
    if ('clubId' in competitionData) {
      if (competitionData.clubId != null) {
        competition.club = { id: competitionData.clubId } as typeof competition.club;
      } else {
        competition.club = null as unknown as typeof competition.club;
      }
    }

    Object.assign(competition, competitionData);
    return this.competitionRepository.save(competition);
  }

  async remove(id: number): Promise<void> {
    const competition = await this.findOne(id);
    await this.competitionRepository.remove(competition);
  }

  async duplicate(id: number): Promise<CompetitionEntity> {
    const original = await this.findOne(id);
    const { id: _, ...competitionData } = original;
    const duplicate = this.competitionRepository.create({
      ...competitionData,
      name: `${original.name} (copie)`,
      resultsValidated: false,
    });
    return this.competitionRepository.save(duplicate);
  }

  async validate(id: number): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);
    competition.resultsValidated = true;
    return this.competitionRepository.save(competition);
  }

  async reorganize(dto: ReorganizeCompetitionDto): Promise<void> {
    const competition = await this.findOne(dto.competitionId);

    // Filter out empty races
    const cleanRaces = dto.races.filter(race => race.trim().length > 0);

    // Get all engagements for this competition
    const engagements = await this.raceRepository.find({
      where: { competitionId: dto.competitionId },
    });

    // Update raceCode for each engagement based on new races configuration
    for (const engagement of engagements) {
      if (!engagement.catev) continue;

      // Find the race that contains this engagement's catev
      const newRaceCode = cleanRaces.find(race =>
        race.split('/').includes(engagement.catev as string),
      );

      if (newRaceCode && newRaceCode !== engagement.raceCode) {
        engagement.raceCode = newRaceCode;
        await this.raceRepository.save(engagement);
      }
    }

    // Update competition races (stored as comma-separated string)
    competition.races = cleanRaces.join(',');
    await this.competitionRepository.save(competition);
  }
}
