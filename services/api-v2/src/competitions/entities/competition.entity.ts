import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Federation, CompetitionType } from '../../common/enums';
import { ClubEntity } from '../../clubs/entities/club.entity';

@Entity('competition')
export class CompetitionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_date', type: 'timestamp' })
  @Index()
  eventDate: Date;

  @ManyToOne(() => ClubEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'club_id' })
  club: ClubEntity;

  @Column({ name: 'club_id', nullable: true })
  clubId: number;

  @Column({ nullable: true })
  name: string;

  @Column({ name: 'zip_code' })
  zipCode: string;

  @Column({ nullable: true, type: 'text' })
  info: string;

  @Column('text')
  categories: string;

  @Column({ nullable: true, type: 'text' })
  observations: string;

  @Column('json', { nullable: true })
  pricing: any;

  @Column('text')
  races: string;

  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'competition_fede_enum',
    default: Federation.FSGT,
  })
  fede: Federation;

  @Column({
    name: 'competition_type',
    type: 'enum',
    enum: CompetitionType,
    enumName: 'competition_competition_type_enum',
    default: CompetitionType.ROUTE,
  })
  competitionType: CompetitionType;

  @Column({ name: 'competition_info', type: 'json', nullable: true })
  competitionInfo: any;

  @Column({ name: 'lieu_dossard', nullable: true })
  lieuDossard: string;

  @Column({ name: 'lieu_dossard_gps', nullable: true })
  lieuDossardGPS: string;

  @Column({ name: 'longueur_circuit', nullable: true })
  longueurCircuit: string;

  @Column({ nullable: true })
  siteweb: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  @Column({ name: 'opened_to_other_fede', nullable: true })
  openedToOtherFede: boolean;

  @Column({ name: 'opened_nl', nullable: true })
  openedNL: boolean;

  @Column({ length: 2, nullable: true })
  dept: string;

  @Column({ nullable: true })
  rankingUrl: string;

  @Column({ nullable: true })
  commissaires: string;

  @Column({ nullable: true })
  speaker: string;

  @Column({ nullable: true })
  aboyeur: string;

  @Column({ nullable: true, type: 'text' })
  feedback: string;

  @Column({ name: 'results_validated', nullable: true })
  resultsValidated: boolean;

  @Column({ name: 'photo_urls', type: 'json', nullable: true })
  photoUrls: any;

  @Column({ name: 'ranking_urls', type: 'json', nullable: true })
  rankingUrls: any;

  @Column({ name: 'avec_chrono', nullable: true, default: false })
  avecChrono: boolean;

  @Column({ name: 'registration_urls', type: 'json', nullable: true })
  registrationUrls: any;
}
