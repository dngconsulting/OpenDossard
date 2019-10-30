/**
 * Application users
 */
import {ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class User {
    @ApiModelProperty()
    @PrimaryGeneratedColumn()
    public id: number;

    @ApiModelPropertyOptional()
    @Column({nullable: true})
    public firstName: string;

    @Column({nullable: true})
    @ApiModelPropertyOptional()
    public lastName: string;

    @Column({nullable: true})
    @ApiModelPropertyOptional()
    public password: string;

    @Column({nullable: false})
    @ApiModelProperty()
    public email: string;

    @Column({nullable: true})
    @ApiModelPropertyOptional()
    public phone?: string;
}
