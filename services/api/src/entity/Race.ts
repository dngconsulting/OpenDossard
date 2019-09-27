import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Club} from './Club';
import {Competition} from './Competition';
import {Licence} from './Licence';

@Entity()
export class Race {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({nullable: false})
    name: string;

    @ManyToOne((type) => Competition)
    @JoinColumn()
    public competition: Competition;

    @ManyToOne((type) => Licence)
    @JoinColumn()
    public licence: Licence;

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

}
