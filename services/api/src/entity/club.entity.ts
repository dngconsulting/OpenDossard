import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';

@Entity({name: 'club'})
export class ClubEntity {
    @PrimaryGeneratedColumn()
    public id: number;
    @Column({nullable: true,name:'short_name'})
    @Index()
    public shortName: string;
    @Column({nullable: true})
    public dept: string;
    @Column({nullable: false,name:'long_name'})
    public longName: string;
}
