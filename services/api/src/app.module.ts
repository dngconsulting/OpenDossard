import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {LicenceEntity} from './entity/licence.entity';
import {CompetitionEntity} from './entity/competition.entity';
import {ClubEntity} from './entity/club.entity';
import {RaceEntity} from './entity/race.entity';
import {Apiv2Module} from './apiv2.module';
import config from './config';
import {UserEntity} from './entity/user.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: config.db.host,
            port: config.db.port,
            username: config.db.username,
            password: config.db.password,
            database: config.db.database,
            entities: [LicenceEntity, ClubEntity, CompetitionEntity, RaceEntity, UserEntity],
            synchronize: true,
            logging: true,
        }), Apiv2Module],

})
export class AppModule {
}
