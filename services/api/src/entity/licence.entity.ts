import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { FederationEntity } from "./federation.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: "licence" })
export class LicenceEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true, name: "licence_number" })
  @Index()
  licenceNumber: string;

  @Column({ nullable: true })
  @Index()
  name: string;

  @Column({ nullable: true, name: "first_name" })
  @Index()
  firstName: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  club: string;

  @Column({ nullable: true })
  dept: string;

  @Column({ nullable: true, name: "birth_year" })
  birthYear: string;

  @Column({ nullable: true })
  catea: string;

  @Column({ nullable: true })
  catev: string;

  @Column({ nullable: true, name: "catev_cx" })
  catevCX: string;

  @Column({
    type: "enum",
    name: "fede",
    enum: FederationEntity,
    nullable: true,
    default: FederationEntity.NL
  })
  @ApiProperty({ enum: FederationEntity, enumName: "FedeEnum" })
  fede: FederationEntity;

  @Column({ nullable: true })
  saison: string;

  @Column({ nullable: true })
  author: string;

  @Column({ nullable: true, name: "last_changed" })
  @ApiProperty({ type: "string", format: "date-time" })
  lastChanged: Date;

  @Column({ nullable: true })
  comment: string;
}
