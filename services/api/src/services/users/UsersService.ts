import {Service} from '@tsed/common';
import {User} from '../../entity/User';
import {MemoryStorage} from '../storage/MemoryStorage';

@Service()
export class UsersService {
    constructor(private memoryStorage: MemoryStorage) {
        this.memoryStorage.set('users', require('../../../resources/users.json'));
    }

    async find(id: string) {
        const users: User[] = await this.query();
        return users.find((value: User) => value.id === id);
    }

    async findByEmail(email: string): Promise<User> {
        const users: User[] = await this.query();
        return users.find((value: User) => value.email === email);
    }

    async findByCredential(email: string, password: string) {
        const users: User[] = await this.query();
        return users.find((value: User) => value.email === email && value.password === password);
    }

    async create(user: User) {
        user.id = require('node-uuid').v4();
        const users = this.memoryStorage.get<User[]>('users');

        users.push(user);

        this.memoryStorage.set('users', users);

        return user;
    }

    async query(): Promise<User[]> {
        return this.memoryStorage.get<User[]>('users');
    }

    async update(user: User): Promise<User> {

        const users = await this.query();

        const index = users.findIndex((value: User) => value.id === user.id);

        users[index] = user;

        this.memoryStorage.set('users', users);

        return user;
    }
}
