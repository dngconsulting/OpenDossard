import {Body, Controller, Get, Post, Request, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiConsumes, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {AuthService} from '../services/auth.service';
import {User} from '../entity/User';

@Controller('/api/security')
@ApiUseTags('Security')
export class PassportCtrl {
    constructor(private readonly authService: AuthService) {
    }

    @ApiOperation({operationId: 'login', title: 'Login utilisateur', description: 'description'})
    @ApiConsumes('application/json')
    @ApiResponse({status: 200, type: User})
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Body() user: User, @Request() req) {
        const token: {access_token: string} = await this.authService.login(req);
        return {accessToken: token.access_token, ...req.user};
    }

    @ApiOperation({
        operationId: 'me',
        title: 'identifiant courant',
        description: 'identifiant courant'
    })
    @ApiResponse({status: 200, type: User})
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    me(@Request() req): User {
        return req.user;
    }
}
