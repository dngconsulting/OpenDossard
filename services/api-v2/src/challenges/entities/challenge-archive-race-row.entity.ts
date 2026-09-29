import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { ChallengeArchiveRiderEntity } from './challenge-archive-rider.entity';

/**
 * Une course comptabilisée dans le classement figé d'un coureur.
 * Les noms d'index et de contraintes sont ceux de la migration AddChallengeArchive.
 */
@Entity('challenge_archive_race_row')
export class ChallengeArchiveRaceRowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_challenge_archive_race_row_rider')
  @Column({ name: 'archive_rider_id', type: 'int' })
  archiveRiderId: number;

  @ManyToOne(() => ChallengeArchiveRiderEntity, rider => rider.raceRows, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'archive_rider_id',
    foreignKeyConstraintName: 'FK_challenge_archive_race_row_rider',
  })
  archiveRider?: ChallengeArchiveRiderEntity;

  /** SET NULL : une épreuve supprimée ne doit pas casser l'archive (nom et date sont copiés). */
  @Index('IDX_challenge_archive_race_row_competition')
  @Column({ name: 'competition_id', type: 'int', nullable: true })
  competitionId: number;

  @ManyToOne(() => CompetitionEntity, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'competition_id',
    foreignKeyConstraintName: 'FK_challenge_archive_race_row_competition',
  })
  competition?: CompetitionEntity;

  @Column({ name: 'competition_name', type: 'text', nullable: true })
  competitionName: string;

  @Column({ name: 'event_date', type: 'timestamp', nullable: true })
  eventDate: Date;

  @Column({ type: 'text', nullable: true })
  catev: string;

  @Column({ name: 'ranking_scratch', type: 'int', nullable: true })
  rankingScratch: number;

  @Column({ name: 'nb_participants', type: 'int' })
  nbParticipants: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'boolean', nullable: true })
  sprintchallenge: boolean;

  @Column({ name: 'pts_race', type: 'double precision' })
  ptsRace: number;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;
}
