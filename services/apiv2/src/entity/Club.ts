import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Club {
    @PrimaryGeneratedColumn()
    public id: number;
    @Column({nullable: true})
    shortName: string;
    @Column({nullable: true})
    dept: string;
    @Column({nullable: false})
    longName: string;
}
