import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { LicenceEntity } from '../../licences/entities/licence.entity';

@Entity('race')
@Index(['competitionId', 'riderNumber', 'raceCode'], { unique: true })
@Index(['competitionId', 'licenceId', 'raceCode'], { unique: true })
export class RaceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CompetitionEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity | null;

  @Column({ name: 'competition_id', type: 'int', nullable: true })
  @Index()
  competitionId: number;

  @ManyToOne(() => LicenceEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'licence_id' })
  licence: LicenceEntity | null;

  @Column({ name: 'licence_id', type: 'int', nullable: true })
  @Index()
  licenceId: number;

  @Column({ name: 'race_code', type: 'varchar', nullable: true })
  @Index()
  raceCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  catev: string | null;

  @Column({ type: 'varchar', nullable: true })
  catea: string | null;

  @Column({ name: 'rider_dossard', type: 'int', nullable: true })
  @Index()
  riderNumber: number | null;

  @Column({ name: 'ranking_scratch', type: 'int', nullable: true })
  @Index()
  rankingScratch: number | null;

  @Column({ name: 'number_min', type: 'int', nullable: true })
  numberMin: number | null;

  @Column({ name: 'number_max', type: 'int', nullable: true })
  numberMax: number | null;

  @Column({ type: 'boolean', nullable: true, default: false })
  surclassed: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  comment: string | null;

  @Column({ type: 'boolean', nullable: true, default: false })
  sprintchallenge: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  club: string | null;

  @Column({ type: 'varchar', nullable: true })
  chrono: string | null;

  @Column({ type: 'int', nullable: true })
  tours: number | null;
}
