import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {Federation} from './Federation';
import {Property} from '@tsed/common';

@Entity()
export class Licence {
    @Property()
    @PrimaryGeneratedColumn()
    public id: number;

    @Property()
    @Column({ nullable: true })
    licenceNumber: string;

    @Property()
    @Column({ nullable: true })
    name: string;

    @Property()
    @Column({ nullable: true })
    firstName: string;

    @Property()
    @Column({ nullable: true })
    gender: string;

    @Property()
    @Column({ nullable: true })
    club: string;

    @Property()
    @Column({ nullable: true })
    dept: string;

    @Property()
    @Column({ nullable: true })
    birthYear: string;

    @Property()
    @Column({ nullable: true })
    catea: string;

    @Property()
    @Column({ nullable: true })
    catev: string;

    @Property()
    @Column({
        type: 'enum',
        enum: Federation,
        nullable: true,
        default: Federation.NL,
    })
    fede: Federation;
}
