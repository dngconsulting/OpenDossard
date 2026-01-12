import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('challenge')
export class ChallengeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  @Index()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  reglement: string;

  @Column({ nullable: true })
  active: boolean;

  @Column({ name: 'competition_ids', type: 'int', array: true, nullable: true })
  competitionIds: number[];

  @Column({ nullable: true, type: 'text' })
  bareme: string;

  @Column({ name: 'competition_type', nullable: true, type: 'text' })
  competitionType: string;
}
