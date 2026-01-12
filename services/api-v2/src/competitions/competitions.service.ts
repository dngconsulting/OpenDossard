import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CompetitionEntity } from './entities/competition.entity';
import { PaginatedResponseDto } from '../common/dto';
import { Federation, CompetitionType } from '../common/enums';

export interface CompetitionFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  fedes?: Federation[];
  competitionTypes?: CompetitionType[];
  depts?: string[];
  startDate?: Date;
  endDate?: Date;
  openedToOtherFede?: boolean;
  openedNL?: boolean;
}

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private competitionRepository: Repository<CompetitionEntity>,
  ) {}

  async findAll(
    filterDto: CompetitionFilterDto,
  ): Promise<PaginatedResponseDto<CompetitionEntity>> {
    const {
      page = 1,
      limit = 20,
      search,
      fedes,
      competitionTypes,
      depts,
      startDate,
      endDate,
      openedToOtherFede,
      openedNL,
    } = filterDto;

    const queryBuilder = this.competitionRepository
      .createQueryBuilder('competition')
      .leftJoinAndSelect('competition.club', 'club');

    if (search) {
      queryBuilder.andWhere(
        '(competition.name ILIKE :search OR competition.zipCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (fedes && fedes.length > 0) {
      queryBuilder.andWhere('competition.fede IN (:...fedes)', { fedes });
    }

    if (competitionTypes && competitionTypes.length > 0) {
      queryBuilder.andWhere(
        'competition.competitionType IN (:...competitionTypes)',
        { competitionTypes },
      );
    }

    if (depts && depts.length > 0) {
      queryBuilder.andWhere('competition.dept IN (:...depts)', { depts });
    }

    if (startDate) {
      queryBuilder.andWhere('competition.eventDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('competition.eventDate <= :endDate', { endDate });
    }

    if (openedToOtherFede !== undefined) {
      queryBuilder.andWhere('competition.openedToOtherFede = :openedToOtherFede', {
        openedToOtherFede,
      });
    }

    if (openedNL !== undefined) {
      queryBuilder.andWhere('competition.openedNL = :openedNL', { openedNL });
    }

    queryBuilder.orderBy('competition.eventDate', 'DESC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
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
  ): Promise<CompetitionEntity> {
    const competition = this.competitionRepository.create(competitionData);
    return this.competitionRepository.save(competition);
  }

  async update(
    id: number,
    competitionData: Partial<CompetitionEntity>,
  ): Promise<CompetitionEntity> {
    const competition = await this.findOne(id);
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
}
