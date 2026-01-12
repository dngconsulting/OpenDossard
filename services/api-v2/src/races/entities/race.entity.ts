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
export class RaceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CompetitionEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'competition_id' })
  competition: CompetitionEntity;

  @Column({ name: 'competition_id', nullable: true })
  competitionId: number;

  @ManyToOne(() => LicenceEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'licence_id' })
  licence: LicenceEntity;

  @Column({ name: 'licence_id', nullable: true })
  licenceId: number;

  @Column({ name: 'race_code', nullable: true })
  @Index()
  raceCode: string;

  @Column({ nullable: true })
  @Index()
  catev: string;

  @Column({ name: 'rider_dossard', nullable: true })
  riderDossard: number;

  @Column({ name: 'ranking_scratch', nullable: true })
  rankingScratch: number;

  @Column({ name: 'number_min', nullable: true })
  numberMin: number;

  @Column({ name: 'number_max', nullable: true })
  numberMax: number;

  @Column({ nullable: true })
  surclassed: boolean;

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  sprintchallenge: boolean;

  @Column({ nullable: true })
  catea: string;

  @Column({ nullable: true })
  club: string;

  @Column({ nullable: true })
  chrono: string;

  @Column({ nullable: true })
  tours: string;
}
