import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';
import {ApiModelProperty} from '@nestjs/swagger';

@Entity({name: 'club'})
export class ClubEntity {
    @ApiModelProperty()
    @PrimaryGeneratedColumn()
    public id: number;
    @ApiModelProperty()
    @Column({nullable: true})
    @Index()
    public shortName: string;
    @ApiModelProperty()
    @Column({nullable: true})
    public dept: string;
    @ApiModelProperty()
    @Column({nullable: false})
    public longName: string;
}
