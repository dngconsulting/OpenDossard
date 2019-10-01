import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Licence} from './entity/Licence';
import {Competition} from './entity/Competition';
import {Club} from './entity/Club';
import {Race} from './entity/Race';
import {Apiv2Module} from './apiv2.module';

@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'dossarddb',
        port: 5432,
        username: 'dossarduser',
        password: 'dossardpwd',
        database: 'dossarddb',
        entities: [Licence, Club, Competition, Race],
        synchronize: true,
    }), Apiv2Module],

})
export class AppModule {
}
