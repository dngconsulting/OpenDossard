import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeEntity } from './entities/challenge.entity';

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
      challenge.competitionIds = challenge.competitionIds.filter(
        (cid) => cid !== competitionId,
      );
    }
    return this.challengeRepository.save(challenge);
  }

  async getRanking(id: number): Promise<{ licenceId: number; name: string; points: number; rank: number }[]> {
    // This would be a complex query joining races and computing rankings
    // based on the bareme (scoring system). For now, return empty array.
    // Implementation depends on the exact scoring rules.
    const challenge = await this.findOne(id);

    // TODO: Implement actual ranking calculation based on:
    // - challenge.competitionIds to get competitions
    // - challenge.bareme to get scoring system
    // - races results to compute points

    return [];
  }
}
