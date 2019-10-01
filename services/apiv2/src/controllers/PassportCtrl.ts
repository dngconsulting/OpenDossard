import {Controller, Post, Request, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {User} from '../entity/User';

@Controller('/api/security')
@ApiUseTags('Security')
export class PassportCtrl {
    @ApiOperation({operationId: 'login', title: 'Login utilisateur', description: 'description'})
    @ApiResponse({status: 200, type: User})
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        const user: User = req.user;
        delete user.password;
        return user;
    }
}
