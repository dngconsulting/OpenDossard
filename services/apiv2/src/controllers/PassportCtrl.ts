import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('api')
export class PassportCtrl {
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return req.user;
    }
}
