import {Injectable} from '@nestjs/common';
import {User} from '../entity/User';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
    ) {}

    async findOne(username: string): Promise<User | undefined> {
        const user: User = await this.repository.findOne({email: username});
        return user;
    }
}
