import {Injectable} from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
    private readonly users: User[];
    constructor() {
        this.users = [
            {
                id: '583538e9605c9e261eb80042',
                firstName: 'Xavier',
                lastName: 'Gouze',
                password: 'azerty',
                email: 'xavier@gouze.com',
                phone: '044343000',
                address: 'Gagnac',
            },
            {
                id: '583538ea448f69d5dfa9dab0',
                firstName: 'admin',
                lastName: 'admin',
                password: 'azerty',
                email: 'admin@admin.com',
                phone: '+1 (830) 402-2797',
                address: 'Toulouse',
            },
            {
                _id: '583538eabf9ec74ea879c08a',
                firstName: 'Fields',
                lastName: 'Payne',
                password: '583538ea3b30af778abe5983',
                email: 'fields.payne@undefined.us',
                phone: '+1 (899) 573-2046',
                address: '813 Russell Street, Barclay, Marshall Islands, 1740',
            },
        ];
    }

    async findOne(username: string): Promise<User | undefined> {
        return this.users.find(user => user.email === username);
    }
}
