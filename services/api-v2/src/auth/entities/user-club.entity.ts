import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

/**
 * Liaison user ↔ club : un user lié à un club a tous les droits sur les ressources
 * de ce club (compétitions, paiements HelloAsso…). Modèle "plat" : la présence
 * dans la table suffit, pas de sous-rôle.
 *
 * - ADMIN ne nécessite pas de ligne ici (bypass dans `AuthorizationService`).
 * - MOBILE n'est pas concerné par ce scope (le coureur paye pour lui-même).
 * - Les liens sont gérés exclusivement par les ADMIN via `UsersController`.
 */
@Entity('user_club')
@Index('idx_user_club_user', ['userId'])
@Index('idx_user_club_club', ['clubId'])
export class UserClubEntity {
  @PrimaryColumn({ name: 'user_id', type: 'integer' })
  userId: number;

  @PrimaryColumn({ name: 'club_id', type: 'integer' })
  clubId: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;
}
