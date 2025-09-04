import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenceEntity } from './entity/licence.entity';
import { CompetitionEntity } from './entity/competition.entity';
import { ClubEntity } from './entity/club.entity';
import { RaceEntity } from './entity/race.entity';
import { Apiv2Module } from './apiv2.module';
import config from './config';
import { UserEntity } from './entity/user.entity';
import { ChallengeEntity } from './entity/challenge.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config.db.host,
      port: config.db.port,
      username: config.db.username,
      password: config.db.password,
      maxQueryExecutionTime: 10000,
      database: config.db.database,
      entities: [
        LicenceEntity,
        ClubEntity,
        CompetitionEntity,
        RaceEntity,
        UserEntity,
        ChallengeEntity,
      ],
      synchronize: false,
      logging: true,
      poolErrorHandler: (err: any) => {
        Logger.warn('Postgresql connection Pool error ' + JSON.stringify(err));
      },
    }),
    Apiv2Module,
  ],
})
export class AppModule {}
