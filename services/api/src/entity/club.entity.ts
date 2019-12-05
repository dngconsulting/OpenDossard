import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';

@Entity({name: 'club'})
export class ClubEntity {
    @PrimaryGeneratedColumn()
    public id: number;
    @Column({nullable: true})
    @Index()
    public shortName: string;
    @Column({nullable: true})
    public dept: string;
    @Column({nullable: false})
    public longName: string;
}
