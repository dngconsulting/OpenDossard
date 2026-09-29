import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('challenge')
export class ChallengeEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'text' })
  @Index()
  name: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  reglement: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  active: boolean;

  @ApiPropertyOptional({ type: () => [Number] })
  @Column({ name: 'competition_ids', type: 'int', array: true, nullable: true })
  competitionIds: number[];

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  bareme: string;

  @ApiPropertyOptional()
  @Column({ name: 'competition_type', nullable: true, type: 'text' })
  competitionType: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Date de clôture. Null = challenge en cours (classement live).',
  })
  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  /** Admin ayant clôturé. Non sélectionné par défaut, pour ne pas l'exposer aux autres rôles. */
  @Column({ name: 'closed_by', type: 'int', nullable: true, select: false })
  closedBy: number | null;

  /**
   * Relation déclarée uniquement pour la clé étrangère. Ne jamais la charger dans
   * une réponse d'API : `UserEntity` porte le hash du mot de passe et l'email.
   */
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by', foreignKeyConstraintName: 'FK_challenge_closed_by' })
  closedByUser?: UserEntity;
}
