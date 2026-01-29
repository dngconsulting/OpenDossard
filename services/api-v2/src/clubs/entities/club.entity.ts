import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Federation } from '../../common/enums';

@Entity('club')
export class ClubEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional()
  @Column({ name: 'short_name', nullable: true })
  @Index()
  shortName: string;

  @ApiProperty()
  @Column({ name: 'long_name' })
  longName: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  dept: string;

  @ApiPropertyOptional()
  @Column({ name: 'elicence_name', nullable: true })
  elicenceName: string;

  @ApiPropertyOptional({ enum: Federation })
  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'competition_fede_enum',
    default: Federation.FSGT,
    nullable: true,
  })
  fede: Federation;
}
