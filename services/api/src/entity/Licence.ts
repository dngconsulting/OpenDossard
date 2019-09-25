import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {Federation} from './Federation';

@Entity()
export class Licence {

    @PrimaryGeneratedColumn()
    public id: number;
    @Column({ nullable: true })
    licenceNumber: string;
    @Column({ nullable: true })
    nom: string;
    @Column({ nullable: true })
    prenom: string;
    @Column({ nullable: true })
    genre: string;
    @Column({ nullable: true })
    club: string;
    @Column({ nullable: true })
    dept: string;
    @Column({ nullable: true })
    age: string; cat;
    @Column({ nullable: true })
    catea: string;
    @Column({ nullable: true })
    catev: string;
    @Column({
        type: 'enum',
        enum: Federation,
        nullable: true,
        default: Federation.NL,
    })
    fede: Federation;
}
