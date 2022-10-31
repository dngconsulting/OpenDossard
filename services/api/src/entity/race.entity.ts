import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CompetitionEntity } from './competition.entity';
import { LicenceEntity } from './licence.entity';

@Entity({ name: "race" })
export class RaceEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => CompetitionEntity)
  @JoinColumn({ name: "competition_id" })
  public competition: CompetitionEntity;

  @ManyToOne(type => LicenceEntity)
  @JoinColumn({ name: "licence_id" })
  public licence: LicenceEntity;

  @Column({ nullable: true, name: "race_code" })
  @Index()
  public raceCode: string;

  @Column({ nullable: true })
  public catev: string;

  @Column({ nullable: true, name: "rider_dossard" })
  public riderNumber: number;

  @Column({ nullable: true, name: "ranking_scratch" })
  public rankingScratch: number;

  @Column({ nullable: true, name: "number_min" })
  public numberMin: number;

  @Column({ nullable: true, name: "number_max" })
  public numberMax: number;

  @Column({ nullable: true })
  public surclassed: boolean;

  @Column({ nullable: true })
  public comment: string;

  @Column({ nullable: true })
  public sprintchallenge: boolean;

  @Column({ nullable: true })
  public catea: string;

  @Column({ nullable: true })
  public club: string;

  @Column({ nullable: true })
  public chrono: string;

  @Column({ nullable: true })
  public tours: number;
}
