import {Body, Controller, Get, Post, Request, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiConsumes, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthService} from '../services/auth.service';
import {UserEntity} from '../entity/user.entity';

@Controller('/api/auth')
@ApiTags('AuthAPI')
export class AuthenticationController {
    constructor(private readonly authService: AuthService) {
    }

    @ApiOperation({operationId: 'login', summary: 'Login utilisateur', description: 'description'})
    @ApiConsumes('application/json')
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Body() user: UserEntity, @Request() req): Promise<UserEntity> {
        const token: {access_token: string} = await this.authService.login(req.user);
        return {accessToken: token.access_token, ...req.user};
    }

    @ApiOperation({
        operationId: 'me',
        summary: 'identifiant courant',
        description: 'Renvoie l\'identifiant courant',
    })
    @ApiConsumes('application/json')
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    me(@Request() req): UserEntity {
        return req.user;
    }
}
