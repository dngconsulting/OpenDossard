import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Federation, CompetitionType } from '../../common/enums';
import { PricingInfo, CompetitionInfo, LinkInfo } from '../../common/types';
import { ClubEntity } from '../../clubs/entities/club.entity';

@Entity('competition')
export class CompetitionEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ name: 'event_date', type: 'timestamp' })
  @Index()
  eventDate: Date;

  @ApiPropertyOptional({ type: () => ClubEntity })
  @ManyToOne(() => ClubEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'club_id' })
  club: ClubEntity;

  @ApiPropertyOptional()
  @Column({ name: 'club_id', nullable: true })
  clubId: number;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  name: string;

  @ApiProperty()
  @Column({ name: 'zip_code' })
  zipCode: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  info: string;

  @ApiProperty()
  @Column('text')
  categories: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  observations: string;

  @ApiPropertyOptional({ type: () => [Object] })
  @Column('json', { nullable: true })
  pricing: PricingInfo[];

  @ApiProperty()
  @Column('text')
  races: string;

  @ApiProperty({ enum: Federation })
  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'competition_fede_enum',
    default: Federation.FSGT,
  })
  fede: Federation;

  @ApiProperty({ enum: CompetitionType })
  @Column({
    name: 'competition_type',
    type: 'enum',
    enum: CompetitionType,
    enumName: 'competition_competition_type_enum',
    default: CompetitionType.ROUTE,
  })
  competitionType: CompetitionType;

  @ApiPropertyOptional({ type: () => [Object] })
  @Column({ name: 'competition_info', type: 'json', nullable: true })
  competitionInfo: CompetitionInfo[];

  @ApiPropertyOptional()
  @Column({ name: 'lieu_dossard', nullable: true })
  lieuDossard: string;

  @ApiPropertyOptional()
  @Column({ name: 'lieu_dossard_gps', nullable: true })
  lieuDossardGPS: string;

  @ApiPropertyOptional()
  @Column({ name: 'longueur_circuit', nullable: true })
  longueurCircuit: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  siteweb: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  facebook: string;

  @ApiPropertyOptional()
  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @ApiPropertyOptional()
  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @ApiPropertyOptional()
  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  @ApiPropertyOptional()
  @Column({ name: 'opened_to_other_fede', nullable: true })
  openedToOtherFede: boolean;

  @ApiPropertyOptional()
  @Column({ name: 'opened_nl', nullable: true })
  openedNL: boolean;

  @ApiPropertyOptional()
  @Column({ length: 2, nullable: true })
  dept: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  rankingUrl: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  commissaires: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  speaker: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  aboyeur: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  feedback: string;

  @ApiPropertyOptional()
  @Column({ name: 'results_validated', nullable: true })
  resultsValidated: boolean;

  @ApiPropertyOptional({ type: () => [Object] })
  @Column({ name: 'photo_urls', type: 'json', nullable: true })
  photoUrls: LinkInfo[];

  @ApiPropertyOptional({ type: () => [Object] })
  @Column({ name: 'ranking_urls', type: 'json', nullable: true })
  rankingUrls: LinkInfo[];

  @ApiPropertyOptional()
  @Column({ name: 'avec_chrono', nullable: true, default: false })
  avecChrono: boolean;

  @ApiPropertyOptional({ type: () => [Object] })
  @Column({ name: 'registration_urls', type: 'json', nullable: true })
  registrationUrls: LinkInfo[];
}
