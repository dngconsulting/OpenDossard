import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';
import {FederationEntity} from './federation.entity';
import {ApiProperty} from '@nestjs/swagger';

@Entity({name: 'licence'})
export class LicenceEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({nullable: true})
    @Index()
    licenceNumber: string;

    @Column({nullable: true})
    @Index()
    name: string;

    @Column({nullable: true})
    @Index()
    firstName: string;

    @Column({nullable: true})
    gender: string;

    @Column({nullable: true})
    club: string;

    @Column({nullable: true})
    dept: string;

    @Column({nullable: true})
    birthYear: string;

    @Column({nullable: true})
    catea: string;

    @Column({nullable: true})
    catev: string;

    @Column({
        type: 'enum',
        name: 'fede',
        enum: FederationEntity,
        nullable: true,
        default: FederationEntity.NL,
    })
    @ApiProperty({ enum: FederationEntity})
    fede: FederationEntity;
}
