import {Injectable} from '@nestjs/common';
import {UsersService} from './users.service';
import {JwtService} from '@nestjs/jwt';
import {User} from '../entity/User';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService,
                private readonly jwtService: JwtService) {
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        if (user && user.password === pass) {
            const {password, ...result} = user;
            return result;
        }
        return null;
    }

    async login(user: User) {
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
