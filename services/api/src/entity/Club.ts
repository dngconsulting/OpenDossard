import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Club {
    @PrimaryGeneratedColumn()
    public id: number
    @Column({nullable: false})
    nomCourt: string
    @Column({nullable: true})
    dept : string
    @Column({nullable: true})
    nomLong: string
}
