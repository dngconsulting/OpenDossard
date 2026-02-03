import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { LicenceEntity } from '../../licences/entities/licence.entity';

@Entity('race')
@Index(['competitionId', 'riderNumber', 'raceCode'], { unique: true })
@Index(['competitionId', 'licenceId', 'raceCode'], { unique: true })
export class RaceEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ type: () => CompetitionEntity })
  @ManyToOne(() => CompetitionEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity | null;

  @ApiPropertyOptional()
  @Column({ name: 'competition_id', type: 'int', nullable: true })
  @Index()
  competitionId: number;

  @ApiPropertyOptional({ type: () => LicenceEntity })
  @ManyToOne(() => LicenceEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'licence_id' })
  licence: LicenceEntity | null;

  @ApiPropertyOptional()
  @Column({ name: 'licence_id', type: 'int', nullable: true })
  @Index()
  licenceId: number;

  @ApiPropertyOptional()
  @Column({ name: 'race_code', type: 'varchar', nullable: true })
  @Index()
  raceCode: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  @Index()
  catev: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  catea: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'rider_dossard', type: 'int', nullable: true })
  @Index()
  riderNumber: number | null;

  @ApiPropertyOptional()
  @Column({ name: 'ranking_scratch', type: 'int', nullable: true })
  @Index()
  rankingScratch: number | null;

  @ApiPropertyOptional()
  @Column({ name: 'number_min', type: 'int', nullable: true })
  numberMin: number | null;

  @ApiPropertyOptional()
  @Column({ name: 'number_max', type: 'int', nullable: true })
  numberMax: number | null;

  @ApiPropertyOptional()
  @Column({ type: 'boolean', nullable: true, default: false })
  surclassed: boolean | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  comment: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'boolean', nullable: true, default: false })
  sprintchallenge: boolean | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  club: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  chrono: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'int', nullable: true })
  tours: number | null;
}
