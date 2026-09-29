import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { LicenceEntity } from '../../licences/entities/licence.entity';
import { ChallengeEntity } from './challenge.entity';
import { ChallengeArchiveRaceRowEntity } from './challenge-archive-race-row.entity';

/**
 * Classement figé d'un coureur à la clôture d'un challenge.
 * Les noms d'index et de contraintes sont ceux de la migration AddChallengeArchive.
 */
@Entity('challenge_archive_rider')
@Index('UQ_challenge_archive_rider_challenge_licence', ['challengeId', 'licenceId'], {
  unique: true,
})
export class ChallengeArchiveRiderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'challenge_id', type: 'int' })
  challengeId: number;

  @ManyToOne(() => ChallengeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'challenge_id',
    foreignKeyConstraintName: 'FK_challenge_archive_rider_challenge',
  })
  challenge?: ChallengeEntity;

  @Index('IDX_challenge_archive_rider_licence')
  @Column({ name: 'licence_id', type: 'int' })
  licenceId: number;

  @ManyToOne(() => LicenceEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'licence_id',
    foreignKeyConstraintName: 'FK_challenge_archive_rider_licence',
  })
  licence?: LicenceEntity;

  @Column({ type: 'text', nullable: true })
  gender: string;

  /** Catégorie de classement au moment de la clôture (= currentLicenceCatev). */
  @Column({ type: 'text', nullable: true })
  catev: string;

  @Column({ type: 'text', nullable: true })
  catea: string;

  @Column({ type: 'text', nullable: true })
  club: string;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ name: 'first_name', type: 'text', nullable: true })
  firstName: string;

  @Column({ name: 'pts_all_races', type: 'double precision' })
  ptsAllRaces: number;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'boolean', nullable: true })
  sprintchallenge: boolean | null;

  /** Rang dans (challenge, sexe, catégorie), départage inclus. Ex æquo possibles. */
  @Column({ type: 'int' })
  rank: number;

  @OneToMany(() => ChallengeArchiveRaceRowEntity, row => row.archiveRider, { cascade: ['insert'] })
  raceRows: ChallengeArchiveRaceRowEntity[];
}
