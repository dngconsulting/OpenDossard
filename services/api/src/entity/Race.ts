import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Competition} from './Competition';
import {Licence} from './Licence';

@Entity()
export class Race {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => Competition)
    @JoinColumn()
    public competition: Competition;

    @ManyToOne((type) => Licence)
    @JoinColumn()
    public licence: Licence;

    @Column({nullable: true})
    public raceCode: string;

    @Column({nullable: true})
    public catev: string;

    @Column({nullable: true})
    public riderNumber: number;

    @Column({nullable: true})
    public rankingScratch: number;

    @Column({nullable: true})
    public numberMin: number;

    @Column({nullable: true})
    public numberMax: number;

    @Column({nullable: true})
    public surclassed: boolean;

    @Column({nullable: true})
    public comment: string;

    @Column({nullable: true})
    public sprintchallenge: boolean;

}
