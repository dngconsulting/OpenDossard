import {MiddlewareConsumer, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Licence} from './entity/Licence';
import {Competition} from './entity/Competition';
import {Club} from './entity/Club';
import {Race} from './entity/Race';
import {Apiv2Module} from './apiv2.module';
import config from './config';
import {ServeStaticMiddleware} from '@nest-middlewares/serve-static';
import {join} from 'path';
import {User} from './entity/User';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: config.db.host,
            port: config.db.port,
            username: config.db.username,
            password: config.db.password,
            database: config.db.database,
            entities: [Licence, Club, Competition, Race, User],
            synchronize: true,
            logging: true,
        }), Apiv2Module],

})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        ServeStaticMiddleware.configure(join(__dirname, '../..', 'client/build'));
        consumer.apply(ServeStaticMiddleware).forRoutes('*');
    }
}
