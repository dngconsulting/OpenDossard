/**
 * Application users
 */
import {ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer';

@Entity({name: 'user'})
export class UserEntity {
    @Exclude()
    @ApiModelPropertyOptional()
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

    @ApiModelPropertyOptional()
    public accessToken?: string;
}
