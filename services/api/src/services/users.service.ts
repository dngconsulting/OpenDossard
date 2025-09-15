import {Injectable} from '@nestjs/common';
import {UserEntity} from '../entity/user.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
    ) {}

    async findOne(username: string): Promise<UserEntity | undefined> {
        const user: UserEntity = await this.repository.findOne({ where: { email: username }});
        return user;
    }
}
