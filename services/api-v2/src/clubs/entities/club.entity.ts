import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Federation } from '../../common/enums';

@Entity('club')
export class ClubEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'short_name', nullable: true })
  @Index()
  shortName: string;

  @Column({ name: 'long_name' })
  longName: string;

  @Column({ nullable: true })
  dept: string;

  @Column({ name: 'elicence_name', nullable: true })
  elicenceName: string;

  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'competition_fede_enum',
    default: Federation.FSGT,
    nullable: true,
  })
  fede: Federation;
}
