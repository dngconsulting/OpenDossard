import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { fromArchiveEntities, toArchiveEntities } from './challenge-archive.mapper';
import { RankedChallengeRider } from './challenge-ranking.utils';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { ChallengeArchiveRiderEntity } from './entities/challenge-archive-rider.entity';

/**
 * Lignes de courses maximum par INSERT. Postgres limite une requête à 65 535
 * paramètres liés ; une ligne de course en consomme une douzaine, d'où ~5 400
 * lignes au plus. TypeORM insère toutes les lignes en cascade d'un même `save`
 * en une seule requête : on découpe donc par lots de coureurs, bornés par leur
 * nombre total de lignes de courses (un coureur peut en avoir des dizaines).
 */
export const ARCHIVE_INSERT_MAX_RACE_ROWS = 2000;

/** Regroupe les coureurs en lots d'au plus `max` lignes de courses (au moins un coureur par lot). */
function batchByRaceRows(
  riders: ChallengeArchiveRiderEntity[],
  max: number,
): ChallengeArchiveRiderEntity[][] {
  const batches: ChallengeArchiveRiderEntity[][] = [];
  let current: ChallengeArchiveRiderEntity[] = [];
  let rows = 0;
  for (const rider of riders) {
    const riderRows = rider.raceRows.length;
    if (current.length > 0 && rows + riderRows > max) {
      batches.push(current);
      current = [];
      rows = 0;
    }
    current.push(rider);
    rows += riderRows;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

@Injectable()
export class ChallengeArchiveService {
  constructor(
    @InjectRepository(ChallengeArchiveRiderEntity)
    private readonly riderRepository: Repository<ChallengeArchiveRiderEntity>,
  ) {}

  /**
   * Écrit le classement figé (les lignes de courses suivent par cascade insert).
   * Lots insérés dans l'ordre du classement : les id croissants conservent cet ordre à la relecture.
   */
  async save(
    manager: EntityManager,
    challengeId: number,
    ranking: RankedChallengeRider[],
  ): Promise<void> {
    const riders = toArchiveEntities(challengeId, ranking);
    for (const batch of batchByRaceRows(riders, ARCHIVE_INSERT_MAX_RACE_ROWS)) {
      await manager.save(ChallengeArchiveRiderEntity, batch);
    }
  }

  /** Supprime l'archive (les lignes de courses suivent par ON DELETE CASCADE). */
  async remove(manager: EntityManager, challengeId: number): Promise<void> {
    await manager.delete(ChallengeArchiveRiderEntity, { challengeId });
  }

  /**
   * Relit l'archive dans l'ordre d'insertion, c'est-à-dire l'ordre du classement à la clôture.
   * `manager` permet de lire dans la transaction de l'appelant.
   */
  async read(
    challengeId: number,
    manager: EntityManager = this.riderRepository.manager,
  ): Promise<ChallengeRiderDto[]> {
    const riders = await manager.find(ChallengeArchiveRiderEntity, {
      where: { challengeId },
      relations: { raceRows: true },
      order: { id: 'ASC', raceRows: { id: 'ASC' } },
    });
    return fromArchiveEntities(riders);
  }
}
