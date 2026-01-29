import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
