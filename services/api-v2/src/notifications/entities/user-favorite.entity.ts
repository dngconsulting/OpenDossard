import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { UserEntity } from '../../users/entities/user.entity';

/**
 * Épreuve starrée (favori) d'un utilisateur mobile — table `user_favorites`.
 *
 * 1 ligne = 1 star. L'unicité `(user_id, competition_id)` rend le star
 * idempotent (re-star = no-op via ON CONFLICT DO NOTHING). L'index sur
 * `competition_id` sert le fan-out des notifications : « tous les users qui
 * ont starré l'épreuve X ».
 *
 * `ON DELETE CASCADE` des deux côtés : suppression du compte (RGPD) ou de
 * l'épreuve → purge automatique des favoris.
 *
 * Les relations `user`/`competition` ne sont jamais lues par le code : elles
 * existent pour que `synchronize` (schéma e2e) génère les mêmes FK CASCADE
 * que la migration. Ne pas les supprimer — les tests e2e de cascade en
 * dépendent.
 */
@Entity('user_favorites')
@Index(['userId', 'competitionId'], { unique: true })
export class UserFavoriteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'competition_id', type: 'int' })
  @Index()
  competitionId: number;

  @ManyToOne(() => UserEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @ManyToOne(() => CompetitionEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competition_id' })
  competition?: CompetitionEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
