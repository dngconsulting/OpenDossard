/**
 * Application users
 */
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer';

@Entity({name: 'user'})
export class UserEntity {
    @Exclude()
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({nullable: true,name:'first_name'})
    public firstName?: string;

    @Column({nullable: true,name:'last_name'})
    public lastName?: string;

    @Column({nullable: true})
    public password?: string;

    @Column({nullable: false})
    public email: string;

    @Column({type:'simple-array',nullable: true})
    public roles?: string[];

    @Column({nullable: true})
    public phone?: string;

    public accessToken?: string;
}
