import {Module, Scope} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Licence} from './entity/Licence';
import {Competition} from './entity/Competition';
import {Club} from './entity/Club';
import {Race} from './entity/Race';
import {LicencesCtrl} from './controllers/LicencesCtrl';
import {AppService} from './services/app.service';
import {UsersService} from './services/users.service';
import {AuthService} from './services/auth.service';
import {LocalStrategy} from './services/local.strategy';
import {PassportModule} from '@nestjs/passport';
import {PassportCtrl} from './controllers/PassportCtrl';
import {RacesCtrl} from './controllers/RaceCtrl';
import {FactoryProvider} from '@nestjs/common/interfaces';
import {APP_INTERCEPTOR} from '@nestjs/core';
import {RlogInterceptor} from './interceptors/rlog.interceptor';
import {CompetitionCtrl} from './controllers/CompetitionCtrl';
import {ClubCtrl} from './controllers/ClubCtrl';
import {User} from './entity/User';
import {JwtModule} from '@nestjs/jwt';
import {jwtConstants} from './util/constants';
import {JwtStrategy} from './services/jwt.strategy';

const RLog: FactoryProvider = {
    provide: APP_INTERCEPTOR,
    scope: Scope.REQUEST,
    inject: [AppService],
    useFactory: (appService: AppService) => {
        return new RlogInterceptor('custom');
    },
};

@Module({
    imports: [TypeOrmModule.forFeature([Licence, Club, Competition, Race, User]), PassportModule, JwtModule.register({
        secret: jwtConstants.secret,
        signOptions: { expiresIn: '60s' },
    })],
    providers: [AppService, UsersService, AuthService, LocalStrategy, JwtStrategy, RLog],
    exports: [UsersService],
    controllers: [LicencesCtrl, PassportCtrl, RacesCtrl, CompetitionCtrl, ClubCtrl],
})
export class Apiv2Module {
}
