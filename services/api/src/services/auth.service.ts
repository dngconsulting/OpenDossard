import {Injectable, Logger} from '@nestjs/common';
import {UsersService} from './users.service';
import {JwtService} from '@nestjs/jwt';
import {UserEntity} from '../entity/user.entity';
const bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService,
                private readonly jwtService: JwtService) {
    }

    async validateUser(username: string, pass: string): Promise<any> {
        Logger.debug('Check user ' + username + ' pass=' + pass);
        const user = await this.usersService.findOne(username);
        Logger.debug('user found ? ' + JSON.stringify(user));
        const passok = bcrypt.compareSync(pass, user.password)
        if (passok) {
            const {password, ...result} = user;
            return result;
        }
        return null;
    }

    async login(user: UserEntity) {
        // We put here the fields we want to encode in JWT
        const payload = {
            email: user.email,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
