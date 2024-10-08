import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "challenge" })
export class ChallengeEntity {
  @PrimaryGeneratedColumn()
  public id: number;
  @Column({ nullable: true, name: "name" })
  @Index()
  public name: string;
  @Column({ nullable: true, name: "description" })
  public description: string;
  @Column({ nullable: true, name: "reglement" })
  public reglement: string;
  @Column({ nullable: true, name: "active" })
  public active: boolean;
  @Column({ type: "integer", name: "competition_ids", array: true })
  public competitionIds: number[];
}
