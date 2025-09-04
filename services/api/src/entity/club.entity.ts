import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { FederationEntity } from './federation.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'club' })
export class ClubEntity {
  @PrimaryGeneratedColumn()
  public id: number;
  @Column({ nullable: true, name: 'short_name' })
  @Index()
  public shortName: string;
  @Column({ nullable: true })
  public dept: string;
  @Column({ nullable: true, name: 'elicence_name' })
  public elicenceName: string;
  @Column({ nullable: false, name: 'long_name' })
  public longName: string;
  @Column({
    type: 'enum',
    name: 'fede',
    enum: FederationEntity,
    nullable: true,
    default: FederationEntity.NL,
  })
  @ApiProperty({ enum: FederationEntity, enumName: 'FedeEnum' })
  fede: FederationEntity;
}
