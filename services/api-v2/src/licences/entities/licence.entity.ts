import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';
import { Federation } from '../../common/enums';

@Entity('licence')
export class LicenceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'licence_number', nullable: true })
  @Index()
  licenceNumber: string;

  @Column({ nullable: true })
  @Index()
  name: string;

  @Column({ name: 'first_name', nullable: true })
  @Index()
  firstName: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  club: string;

  @Column({ nullable: true })
  dept: string;

  @Column({ name: 'birth_year', nullable: true })
  birthYear: string;

  @Column({ nullable: true })
  catea: string;

  @Column({ nullable: true })
  catev: string;

  @Column({ name: 'catev_cx', nullable: true })
  catevCX: string;

  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'licence_fede_enum',
    default: Federation.NL,
  })
  fede: Federation;

  @Column({ nullable: true })
  saison: string;

  @Column({ nullable: true })
  author: string;

  @Column({ name: 'last_changed', type: 'timestamp', nullable: true })
  lastChanged: Date;

  @Column({ nullable: true, type: 'text' })
  comment: string;
}
