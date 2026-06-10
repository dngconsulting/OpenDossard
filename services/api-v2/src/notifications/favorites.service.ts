import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { FavoriteCompetitionDto } from './dto/favorite-competition.dto';
import { UserFavoriteEntity } from './entities/user-favorite.entity';

/**
 * Persistance des épreuves starrées (table `user_favorites`).
 */
@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavoriteEntity)
    private readonly repo: Repository<UserFavoriteEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitions: Repository<CompetitionEntity>,
  ) {}

  /**
   * Star idempotent : `ON CONFLICT DO NOTHING` sur l'index unique
   * `(user_id, competition_id)` — re-star = no-op, jamais d'erreur.
   * 404 si la compétition n'existe pas (check explicite, message propre).
   */
  async star(userId: number, competitionId: number): Promise<void> {
    const competition = await this.competitions.findOne({
      where: { id: competitionId },
      select: { id: true },
    });
    if (!competition) {
      throw new NotFoundException(`Compétition ${competitionId} introuvable`);
    }
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({ userId, competitionId })
      .orIgnore()
      .execute();
  }

  /** Unstar idempotent : supprimer un favori absent est un no-op. */
  async unstar(userId: number, competitionId: number): Promise<void> {
    await this.repo.delete({ userId, competitionId });
  }

  /**
   * Épreuves favorites détaillées pour « Mon compte » (Dossardeur) : nom,
   * date et fédé, épreuve la plus récente d'abord (tie-break sur l'id du
   * favori pour un ordre stable à dates égales). Pas de pagination — la
   * liste est purgée régulièrement des épreuves passées. Jointure + `select`
   * explicites (pas de `find` + relations) pour ne charger ni le club eager
   * ni les colonnes json de `CompetitionEntity`.
   */
  async findFavoriteCompetitions(userId: number): Promise<FavoriteCompetitionDto[]> {
    const rows = await this.repo
      .createQueryBuilder('fav')
      .innerJoin('fav.competition', 'competition')
      .select([
        'fav.id',
        'fav.competitionId',
        'competition.id',
        'competition.name',
        'competition.eventDate',
        'competition.fede',
      ])
      .where('fav.user_id = :userId', { userId })
      .orderBy('competition.eventDate', 'DESC')
      .addOrderBy('fav.id', 'DESC')
      .getMany();
    return rows.map(({ competitionId, competition }) => ({
      competitionId,
      name: competition!.name,
      eventDate: competition!.eventDate,
      fede: competition!.fede,
    }));
  }

  /** Ids des compétitions starrées du user, plus récentes d'abord. */
  async findCompetitionIds(userId: number): Promise<number[]> {
    const rows = await this.repo.find({
      where: { userId },
      select: { competitionId: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map(r => r.competitionId);
  }
}
