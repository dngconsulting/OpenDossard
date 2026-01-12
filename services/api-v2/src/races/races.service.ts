import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RaceEntity } from './entities/race.entity';
import { PaginatedResponseDto } from '../common/dto';

export interface RaceFilterDto {
  page?: number;
  limit?: number;
  competitionId?: number;
  licenceId?: number;
  raceCode?: string;
}

export interface CreateRaceDto {
  competitionId: number;
  licenceId: number;
  raceCode?: string;
  catev?: string;
  riderDossard?: number;
  rankingScratch?: number;
  numberMin?: number;
  numberMax?: number;
  surclassed?: boolean;
  comment?: string;
  sprintchallenge?: boolean;
  catea?: string;
  club?: string;
  chrono?: string;
  tours?: string;
}

export interface UpdateRaceDto {
  rankingScratch?: number;
  chrono?: string;
  tours?: string;
  comment?: string;
  surclassed?: boolean;
  sprintchallenge?: boolean;
}

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(RaceEntity)
    private raceRepository: Repository<RaceEntity>,
  ) {}

  async findAll(filterDto: RaceFilterDto): Promise<PaginatedResponseDto<RaceEntity>> {
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

    queryBuilder.orderBy('race.rankingScratch', 'ASC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByCompetition(competitionId: number): Promise<RaceEntity[]> {
    return this.raceRepository.find({
      where: { competitionId },
      relations: ['licence'],
      order: { raceCode: 'ASC', rankingScratch: 'ASC' },
    });
  }

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

  async create(raceData: CreateRaceDto): Promise<RaceEntity> {
    const race = this.raceRepository.create(raceData);
    return this.raceRepository.save(race);
  }

  async createMany(racesData: CreateRaceDto[]): Promise<RaceEntity[]> {
    const races = this.raceRepository.create(racesData);
    return this.raceRepository.save(races);
  }

  async update(id: number, raceData: UpdateRaceDto): Promise<RaceEntity> {
    const race = await this.findOne(id);
    Object.assign(race, raceData);
    return this.raceRepository.save(race);
  }

  async remove(id: number): Promise<void> {
    const race = await this.findOne(id);
    await this.raceRepository.remove(race);
  }

  async removeByCompetition(competitionId: number): Promise<void> {
    await this.raceRepository.delete({ competitionId });
  }

  async updateResults(
    competitionId: number,
    results: { licenceId: number; raceCode: string; rankingScratch: number; chrono?: string; tours?: string }[],
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
        if (result.tours) race.tours = result.tours;
        updatedRaces.push(await this.raceRepository.save(race));
      }
    }

    return updatedRaces;
  }
}
