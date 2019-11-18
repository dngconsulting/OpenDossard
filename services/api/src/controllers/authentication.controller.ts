import {Body, Controller, Get, Logger, Post, Request, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiConsumes, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {AuthService} from '../services/auth.service';
import {UserEntity} from '../entity/user.entity';

@Controller('/api/auth')
@ApiUseTags('AuthAPI')
export class AuthenticationController {
    constructor(private readonly authService: AuthService) {
    }

    @ApiOperation({operationId: 'login', title: 'Login utilisateur', description: 'description'})
    @ApiConsumes('application/json')
    @ApiResponse({status: 200, type: UserEntity})
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Body() user: UserEntity, @Request() req): Promise<UserEntity> {
        const token: {access_token: string} = await this.authService.login(req.user);
        return {accessToken: token.access_token, ...req.user};
    }

    @ApiOperation({
        operationId: 'me',
        title: 'identifiant courant',
        description: 'identifiant courant'
    })
    @ApiResponse({status: 200, type: UserEntity})
    @ApiConsumes('application/json')
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    me(@Request() req): UserEntity {
        return req.user;
    }
}
