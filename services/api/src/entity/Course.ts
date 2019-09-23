import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Club} from './Club';
import {Epreuve} from './Epreuve';
import {Licence} from './Licence';

@Entity()
export class Course {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({nullable: false})
    nom: string

    @ManyToOne(type => Epreuve)
    @JoinColumn()
    public epreuve : Epreuve

    @ManyToOne(type => Licence)
    @JoinColumn()
    public licence : Licence

    @Column({nullable: true})
    public dossard: number

    @Column({nullable: true})
    public classementScratch: number

    @Column({nullable: true})
    public closed: boolean

    @Column({nullable: true})
    public dossardCourseMin: number

    @Column({nullable: true})
    public dossardCourseMax: number

    @Column({nullable:true})
    public surclassed : boolean

}
