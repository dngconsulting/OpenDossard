import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeEntity } from './entities/challenge.entity';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { ChallengeLiveRankingService } from './challenge-live-ranking.service';
import { withoutRank } from './challenge-ranking.utils';

export interface CreateChallengeDto {
  name: string;
  description?: string;
  reglement?: string;
  active?: boolean;
  competitionIds?: number[];
  bareme: string;
  competitionType: string;
}

export interface UpdateChallengeDto {
  name?: string;
  description?: string;
  reglement?: string;
  active?: boolean;
  competitionIds?: number[];
  bareme?: string;
  competitionType?: string;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(ChallengeEntity)
    private challengeRepository: Repository<ChallengeEntity>,
    private readonly liveRanking: ChallengeLiveRankingService,
  ) {}

  async findAll(active?: boolean): Promise<ChallengeEntity[]> {
    const queryBuilder = this.challengeRepository.createQueryBuilder('challenge');

    if (active !== undefined) {
      queryBuilder.where('challenge.active = :active', { active });
    }

    queryBuilder.orderBy('challenge.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<ChallengeEntity> {
    const challenge = await this.challengeRepository.findOne({
      where: { id },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }
    return challenge;
  }

  async create(challengeData: CreateChallengeDto): Promise<ChallengeEntity> {
    const challenge = this.challengeRepository.create(challengeData);
    return this.challengeRepository.save(challenge);
  }

  async update(id: number, challengeData: UpdateChallengeDto): Promise<ChallengeEntity> {
    const challenge = await this.findOne(id);
    Object.assign(challenge, challengeData);
    return this.challengeRepository.save(challenge);
  }

  async remove(id: number): Promise<void> {
    const challenge = await this.findOne(id);
    await this.challengeRepository.remove(challenge);
  }

  async addCompetition(id: number, competitionId: number): Promise<ChallengeEntity> {
    const challenge = await this.findOne(id);
    if (!challenge.competitionIds) {
      challenge.competitionIds = [];
    }
    if (!challenge.competitionIds.includes(competitionId)) {
      challenge.competitionIds.push(competitionId);
    }
    return this.challengeRepository.save(challenge);
  }

  async removeCompetition(id: number, competitionId: number): Promise<ChallengeEntity> {
    const challenge = await this.findOne(id);
    if (challenge.competitionIds) {
      challenge.competitionIds = challenge.competitionIds.filter(cid => cid !== competitionId);
    }
    return this.challengeRepository.save(challenge);
  }

  async getRanking(id: number): Promise<ChallengeRiderDto[]> {
    const challenge = await this.findOne(id);
    return withoutRank(await this.liveRanking.compute(challenge));
  }
}
