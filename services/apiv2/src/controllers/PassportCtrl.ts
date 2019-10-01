import {Body, Controller, Post, Request, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiConsumes, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {User} from '../entity/User';

@Controller('/api/security')
@ApiUseTags('Security')
export class PassportCtrl {
    @ApiOperation({operationId: 'login', title: 'Login utilisateur', description: 'description'})
    @ApiConsumes('application/json')
    @ApiResponse({status: 200, type: User})
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Body() user: User, @Request() req) {
        const userToReturn: User = req.user;
        delete userToReturn.password;
        return userToReturn;
    }
}
