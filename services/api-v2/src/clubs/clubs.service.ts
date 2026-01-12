import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClubEntity } from './entities/club.entity';
import { Federation } from '../common/enums';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(ClubEntity)
    private clubRepository: Repository<ClubEntity>,
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

  async findOne(id: number): Promise<ClubEntity | null> {
    return this.clubRepository.findOne({ where: { id } });
  }

  async create(clubData: Partial<ClubEntity>): Promise<ClubEntity> {
    const club = this.clubRepository.create(clubData);
    return this.clubRepository.save(club);
  }
}
