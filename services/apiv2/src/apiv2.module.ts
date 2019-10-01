import {Module} from '@nestjs/common';
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

@Module({
    imports: [TypeOrmModule.forFeature([Licence, Club, Competition, Race]), PassportModule],
    providers: [AppService, UsersService, AuthService, LocalStrategy],
    exports: [UsersService],
    controllers: [LicencesCtrl, PassportCtrl, RacesCtrl],
})
export class Apiv2Module {
}
