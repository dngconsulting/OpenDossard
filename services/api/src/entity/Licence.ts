import {Column, Entity, PrimaryGeneratedColumn, Index} from 'typeorm';
import {Federation} from './Federation';
import {ApiModelProperty} from '@nestjs/swagger';

@Entity()
export class Licence {
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
        enum: Federation,
        nullable: true,
        default: Federation.NL,
    })
    fede: Federation;
}
