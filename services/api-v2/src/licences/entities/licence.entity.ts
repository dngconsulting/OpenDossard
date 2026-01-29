import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Federation } from '../../common/enums';

@Entity('licence')
export class LicenceEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional()
  @Column({ name: 'licence_number', nullable: true })
  @Index()
  licenceNumber: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  @Index()
  name: string;

  @ApiPropertyOptional()
  @Column({ name: 'first_name', nullable: true })
  @Index()
  firstName: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  gender: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  club: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  dept: string;

  @ApiPropertyOptional()
  @Column({ name: 'birth_year', nullable: true })
  birthYear: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  catea: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  catev: string;

  @ApiPropertyOptional()
  @Column({ name: 'catev_cx', nullable: true })
  catevCX: string;

  @ApiProperty({ enum: Federation })
  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'licence_fede_enum',
    default: Federation.NL,
  })
  fede: Federation;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  saison: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  author: string;

  @ApiPropertyOptional()
  @Column({ name: 'last_changed', type: 'timestamp', nullable: true })
  lastChanged: Date;

  @ApiPropertyOptional()
  @Column({ nullable: true, type: 'text' })
  comment: string;
}
