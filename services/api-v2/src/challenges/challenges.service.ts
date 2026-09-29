import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { EntityManager, Repository } from 'typeorm';
import { ChallengeEntity } from './entities/challenge.entity';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { ChallengeLiveRankingService } from './challenge-live-ranking.service';
import { ChallengeArchiveService } from './challenge-archive.service';
import { ARCHIVE_TOP_N, keepTop, withoutRank } from './challenge-ranking.utils';

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

/** Champs modifiables via l'API. closedAt et closedBy ne passent que par close et reopen. */
const WRITABLE_FIELDS = [
  'name',
  'description',
  'reglement',
  'active',
  'competitionIds',
  'bareme',
  'competitionType',
] as const;
/** Champs qui changent le classement : figés tant que le challenge est terminé. */
const LOCKED_WHEN_CLOSED = ['competitionIds', 'bareme', 'competitionType'] as const;
const CLOSED_MESSAGE = 'Challenge terminé, rouvrez-le pour le modifier';

/**
 * Vrai si le patch modifie réellement un champ verrouillé. Un formulaire complet
 * renvoie ces champs inchangés : ce n'est pas une modification. Liste de courses
 * absente (null) et vide sont équivalentes.
 */
function changesLockedField(
  challenge: ChallengeEntity,
  patch: Partial<Pick<ChallengeEntity, (typeof WRITABLE_FIELDS)[number]>>,
): boolean {
  return LOCKED_WHEN_CLOSED.some(field => {
    if (patch[field] === undefined) return false;
    if (field === 'competitionIds') {
      // Ensemble d'épreuves : l'ordre et les doublons ne changent pas le classement.
      return _.xor(patch.competitionIds ?? [], challenge.competitionIds ?? []).length > 0;
    }
    return patch[field] !== challenge[field];
  });
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(ChallengeEntity)
    private challengeRepository: Repository<ChallengeEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly liveRanking: ChallengeLiveRankingService,
    private readonly archive: ChallengeArchiveService,
  ) {}

  async findAll(active?: boolean): Promise<ChallengeEntity[]> {
    const queryBuilder = this.challengeRepository.createQueryBuilder('challenge');

    if (active !== undefined) {
      queryBuilder.where('challenge.active = :active', { active });
    }

    // En cours d'abord, puis terminés ; dans chaque groupe, du plus récent au plus
    // ancien selon la dernière épreuve du challenge (sans épreuve : en fin de groupe).
    queryBuilder
      .addSelect(
        '(SELECT MAX(competition.event_date) FROM competition WHERE competition.id = ANY(challenge.competition_ids))',
        'last_event_date',
      )
      .orderBy('challenge.closed_at IS NOT NULL', 'ASC')
      .addOrderBy('last_event_date', 'DESC', 'NULLS LAST')
      .addOrderBy('challenge.name', 'ASC');

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
    const challenge = this.challengeRepository.create(_.pick(challengeData, WRITABLE_FIELDS));
    return this.challengeRepository.save(challenge);
  }

  /** Lecture, vérification et écriture sous verrou : pas de course avec une clôture concurrente. */
  async update(id: number, challengeData: UpdateChallengeDto): Promise<ChallengeEntity> {
    return this.entityManager.transaction(async manager => {
      const challenge = await this.lockChallenge(manager, id);
      const patch = _.pick(challengeData, WRITABLE_FIELDS);
      if (challenge.closedAt && changesLockedField(challenge, patch)) {
        throw new ConflictException(CLOSED_MESSAGE);
      }
      Object.assign(challenge, patch);
      return manager.save(challenge);
    });
  }

  async remove(id: number): Promise<void> {
    const challenge = await this.findOne(id);
    await this.challengeRepository.remove(challenge);
  }

  async addCompetition(id: number, competitionId: number): Promise<ChallengeEntity> {
    return this.entityManager.transaction(async manager => {
      const challenge = await this.lockChallenge(manager, id);
      this.assertOpen(challenge);
      if (!challenge.competitionIds) {
        challenge.competitionIds = [];
      }
      if (!challenge.competitionIds.includes(competitionId)) {
        challenge.competitionIds.push(competitionId);
      }
      return manager.save(challenge);
    });
  }

  async removeCompetition(id: number, competitionId: number): Promise<ChallengeEntity> {
    return this.entityManager.transaction(async manager => {
      const challenge = await this.lockChallenge(manager, id);
      this.assertOpen(challenge);
      if (challenge.competitionIds) {
        challenge.competitionIds = challenge.competitionIds.filter(cid => cid !== competitionId);
      }
      return manager.save(challenge);
    });
  }

  /**
   * Une seule transaction REPEATABLE READ : closedAt, l'archive et le calcul live
   * voient le même instantané (pas d'archive vide lue pendant une réouverture concurrente).
   */
  async getRanking(id: number): Promise<ChallengeRiderDto[]> {
    return this.entityManager.transaction('REPEATABLE READ', async manager => {
      const challenge = await manager.findOne(ChallengeEntity, { where: { id } });
      if (!challenge) {
        throw new NotFoundException(`Challenge with ID ${id} not found`);
      }
      if (challenge.closedAt) {
        return this.archive.read(id, manager);
      }
      return withoutRank(await this.liveRanking.compute(challenge, manager));
    });
  }

  /** Fige le classement live dans l'archive. Verrou de ligne pour éviter une double clôture. */
  async close(id: number, userId: number): Promise<ChallengeEntity> {
    return this.entityManager.transaction(async manager => {
      const challenge = await this.lockChallenge(manager, id);
      if (challenge.closedAt) {
        throw new ConflictException('Challenge déjà terminé');
      }
      const ranking = await this.liveRanking.compute(challenge, manager);
      await this.archive.save(manager, id, keepTop(ranking, ARCHIVE_TOP_N));
      challenge.closedAt = new Date();
      challenge.closedBy = userId;
      await manager.save(challenge);
      return this.withoutClosedBy(challenge);
    });
  }

  /** Supprime l'archive : le classement redevient calculé en direct. */
  async reopen(id: number): Promise<ChallengeEntity> {
    return this.entityManager.transaction(async manager => {
      const challenge = await this.lockChallenge(manager, id);
      if (!challenge.closedAt) {
        throw new ConflictException('Challenge non terminé');
      }
      await this.archive.remove(manager, id);
      challenge.closedAt = null;
      challenge.closedBy = null;
      await manager.save(challenge);
      return this.withoutClosedBy(challenge);
    });
  }

  private async lockChallenge(manager: EntityManager, id: number): Promise<ChallengeEntity> {
    const challenge = await manager.findOne(ChallengeEntity, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }
    return challenge;
  }

  private assertOpen(challenge: ChallengeEntity): void {
    if (challenge.closedAt) {
      throw new ConflictException(CLOSED_MESSAGE);
    }
  }

  /** closedBy est en select: false ; on ne le renvoie pas non plus après l'écriture. */
  private withoutClosedBy(challenge: ChallengeEntity): ChallengeEntity {
    const { closedBy: _closedBy, ...rest } = challenge;
    return rest as ChallengeEntity;
  }
}
