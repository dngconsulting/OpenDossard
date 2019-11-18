import {Column, Entity, PrimaryGeneratedColumn, Index} from 'typeorm';
import {FederationEntity} from './federation.entity';
import {ApiModelProperty} from '@nestjs/swagger';

@Entity({name: 'licence'})
export class LicenceEntity {
    @ApiModelProperty()
    @PrimaryGeneratedColumn()
    public id: number;

    @ApiModelProperty()
    @Column({ nullable: true })
    @Index()
    licenceNumber: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    @Index()
    name: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    @Index()
    firstName: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    gender: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    club: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    dept: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    birthYear: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    catea: string;

    @ApiModelProperty()
    @Column({ nullable: true })
    catev: string;

    @ApiModelProperty()
    @Column({
        type: 'enum',
        name: 'fede',
        enum: FederationEntity,
        nullable: true,
        default: FederationEntity.NL,
    })
    fede: FederationEntity;
}
