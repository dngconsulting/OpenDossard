import {Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {CompetitionEntity} from './competition.entity';
import {LicenceEntity} from './licence.entity';

@Entity({name: 'race'})
export class RaceEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => CompetitionEntity)
    @JoinColumn()
    public competition: CompetitionEntity;

    @ManyToOne((type) => LicenceEntity)
    @JoinColumn()
    public licence: LicenceEntity;

    @Column({nullable: true})
    @Index()
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
