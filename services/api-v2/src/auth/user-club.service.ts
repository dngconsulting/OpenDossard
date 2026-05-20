import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserClubEntity } from './entities/user-club.entity';

export interface SetClubsResult {
  added: number[];
  removed: number[];
  kept: number[];
}

/**
 * CRUD sur la table `user_club`. Encapsule le diff "set complet" qui sert au
 * `PUT /users/:id/clubs` : le caller envoie l'état cible, on calcule ce qu'il
 * faut INSERT/DELETE pour préserver `created_at` des liens conservés.
 *
 * Pas d'enforcement d'autorisation ici — c'est juste de la persistance.
 * L'autorisation est portée par les endpoints (ADMIN-only dans `UsersController`).
 */
@Injectable()
export class UserClubService {
  private readonly logger = new Logger(UserClubService.name);

  constructor(
    @InjectRepository(UserClubEntity)
    private readonly userClubRepo: Repository<UserClubEntity>,
  ) {}

  async findClubIdsForUser(userId: number): Promise<number[]> {
    const links = await this.userClubRepo.find({
      where: { userId },
      order: { clubId: 'ASC' },
    });
    return links.map(l => l.clubId);
  }

  /**
   * Remplace l'ensemble des clubs liés à `userId` par `targetClubIds`.
   * Idempotent : appeler deux fois avec la même liste = no-op au 2e appel.
   * Les `created_at` des liens conservés sont préservés (pas de DELETE+INSERT
   * en masse).
   *
   * **Pré-requis :** les `clubId` doivent exister en DB. Sinon FK violation
   * runtime — la validation préalable est de la responsabilité du caller
   * (cf. `UsersService.setUserClubs`).
   */
  async setClubIdsForUser(userId: number, targetClubIds: number[]): Promise<SetClubsResult> {
    const targetSet = new Set(targetClubIds);
    const existing = await this.userClubRepo.find({ where: { userId } });
    const existingSet = new Set(existing.map(e => e.clubId));

    const added = [...targetSet].filter(id => !existingSet.has(id)).sort((a, b) => a - b);
    const removed = [...existingSet].filter(id => !targetSet.has(id)).sort((a, b) => a - b);
    const kept = [...existingSet].filter(id => targetSet.has(id)).sort((a, b) => a - b);

    if (removed.length > 0) {
      await this.userClubRepo
        .createQueryBuilder()
        .delete()
        .from(UserClubEntity)
        .where('user_id = :userId AND club_id IN (:...clubIds)', { userId, clubIds: removed })
        .execute();
    }
    if (added.length > 0) {
      await this.userClubRepo.insert(added.map(clubId => ({ userId, clubId })));
    }

    this.logger.log(
      `setClubIdsForUser userId=${userId} added=[${added.join(',')}] removed=[${removed.join(',')}] kept=[${kept.join(',')}]`,
    );

    return { added, removed, kept };
  }
}
