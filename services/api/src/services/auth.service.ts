import {Injectable, Logger} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {JwtService} from '@nestjs/jwt';
import {UsersService} from './users.service';
import {UserEntity} from '../entity/user.entity';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService,
                private readonly jwtService: JwtService) {
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        const passok = bcrypt.compareSync(pass, user.password);
        if (passok) {
            const {password, ...result} = user;
            return result;
        }
        Logger.debug('Incorrect username/password');
        return null;
    }

    async login(user: UserEntity) {
        // We put here the fields we want to encode in JWT
        const payload = {
            email: user.email,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
