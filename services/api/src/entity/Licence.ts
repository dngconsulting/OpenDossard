import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Licence {

    @PrimaryGeneratedColumn()
    public id : number
    @Column({ nullable: true })
    licenceNumber: string;
    @Column({ nullable: true })
    nom: string
    @Column({ nullable: true })
    prenom: string
    @Column({ nullable: true })
    genre : string
    @Column({ nullable: true })
    club : string
    @Column({ nullable: true })
    dept : string
    @Column({ nullable: true })
    age:string
    @Column({ nullable: true })
    catea:string
    @Column({ nullable: true })
    catev:string

}
