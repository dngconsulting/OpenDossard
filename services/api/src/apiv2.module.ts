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

const RLog: FactoryProvider = {
    provide: APP_INTERCEPTOR,
    scope: Scope.REQUEST,
    inject: [AppService],
    useFactory: (appService: AppService) => {
        return new RlogInterceptor('foo');
    },
};

@Module({
    imports: [TypeOrmModule.forFeature([Licence, Club, Competition, Race]), PassportModule],
    providers: [AppService, UsersService, AuthService, LocalStrategy, RLog],
    exports: [UsersService],
    controllers: [LicencesCtrl, PassportCtrl, RacesCtrl, CompetitionCtrl],
})
export class Apiv2Module {
}
