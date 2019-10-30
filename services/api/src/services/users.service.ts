import {Injectable} from '@nestjs/common';
import {User} from '../entity/User';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

const users = [
    {
        id: 1,
        firstName: 'Xavier',
        lastName: 'Gouze',
        password: 'azerty',
        email: 'xavier@gouze.com',
        phone: '044343000',
    },
    {
        id: 2,
        firstName: 'admin',
        lastName: 'admin',
        password: 'azerty',
        email: 'admin@admin.com',
        phone: '+1 (830) 402-2797',
    },
    {
        id: 3,
        firstName: 'Fields',
        lastName: 'Payne',
        password: '583538ea3b30af778abe5983',
        email: 'fields.payne@undefined.us',
        phone: '+1 (899) 573-2046',
    },
];

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
    ) {}

    async findOne(username: string): Promise<User | undefined> {
        const user: User = await this.repository.findOne({email: username});
        console.log('USER =' + JSON.stringify(user));
        return user;
    }
}
