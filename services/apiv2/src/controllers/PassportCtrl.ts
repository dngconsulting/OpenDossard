import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {ApiOperation, ApiUseTags} from '@nestjs/swagger';

@Controller('/api/security')
@ApiUseTags('Security')
export class PassportCtrl {
    @ApiOperation({ title: 'Login utilisateur' })
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return req.user;
    }
}
