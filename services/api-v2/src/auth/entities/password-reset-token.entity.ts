import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';

/** Index unique partiel : un seul token non utilisé par user (demandes concurrentes). */
export const ACTIVE_TOKEN_PER_USER_INDEX = 'UQ_password_reset_token_active_user';

/**
 * Token de réinitialisation de mot de passe, à usage unique (1 h). Seul le hash
 * SHA-256 (hex) est stocké : une fuite de la table ne permet pas de réinitialiser.
 * Les noms d'index et de contraintes sont ceux de la migration AddPasswordResetToken.
 */
@Entity('password_reset_token')
@Index(ACTIVE_TOKEN_PER_USER_INDEX, ['userId'], { unique: true, where: '"used_at" IS NULL' })
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Index simple conservé : l'index partiel ne couvre pas les tokens utilisés,
  // or la cascade de la FK (suppression d'un user) les parcourt tous.
  @Index('IDX_password_reset_token_user')
  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_password_reset_token_user' })
  user?: UserEntity;

  @Index('UQ_password_reset_token_hash', { unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  /** Renseigné à la consommation : un token utilisé n'est plus jamais accepté. */
  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  /** Toujours fourni par Node (pas de défaut SQL), comme les autres dates. */
  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
