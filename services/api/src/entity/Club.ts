import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {ApiModelProperty} from '@nestjs/swagger';

@Entity()
export class Club {
    @ApiModelProperty()
    @PrimaryGeneratedColumn()
    public id: number;
    @ApiModelProperty()
    @Column({nullable: true})
    shortName: string;
    @ApiModelProperty()
    @Column({nullable: true})
    dept: string;
    @ApiModelProperty()
    @Column({nullable: false})
    longName: string;
}
