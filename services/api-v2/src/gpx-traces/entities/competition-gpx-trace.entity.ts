import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompetitionEntity } from '../../competitions/entities/competition.entity';

/** `ign` : RGE ALTI ; `gpx` : altitudes du fichier (hors couverture IGN) ; `none` : aucune. */
export type ElevationSource = 'ign' | 'gpx' | 'none';

/**
 * Tracé GPX d'un circuit. Les noms d'index et de contraintes sont ceux de la
 * migration AddCompetitionGpxTraces.
 */
@Entity('competition_gpx_trace')
export class CompetitionGpxTraceEntity {
  /** Généré côté API (`randomUUID`) : aucune extension SQL requise. */
  @PrimaryColumn('uuid')
  id: string;

  @Index('IDX_competition_gpx_trace_competition')
  @Column({ name: 'competition_id', type: 'int' })
  competitionId: number;

  @ManyToOne(() => CompetitionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'competition_id',
    foreignKeyConstraintName: 'FK_competition_gpx_trace_competition',
  })
  competition?: CompetitionEntity;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  /**
   * Points du GPX déposé, format compact gzip (`gpx-points.ts`) : base de tout
   * recalcul et du GPX téléchargeable. Jamais renvoyé par les listes.
   */
  @Column({ name: 'gpx_points_gz', type: 'bytea', select: false })
  gpxPointsGz: Buffer;

  /** Tracé calculé servi aux apps (`GpxTracePayload`, JSON gzip). */
  @Column({ name: 'track_gz', type: 'bytea', select: false })
  trackGz: Buffer;

  @Column({ type: 'double precision' })
  distance: number;

  @Column({ type: 'double precision' })
  ascent: number;

  @Column({ type: 'double precision' })
  descent: number;

  @Column({ name: 'min_elevation', type: 'double precision' })
  minElevation: number;

  @Column({ name: 'max_elevation', type: 'double precision' })
  maxElevation: number;

  @Column({ name: 'point_count', type: 'int' })
  pointCount: number;

  @Column({ name: 'elevation_source', type: 'text' })
  elevationSource: ElevationSource;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
