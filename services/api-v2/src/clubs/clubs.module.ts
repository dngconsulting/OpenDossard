import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ClubEntity } from './entities/club.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { HelloAssoDetailsEntity } from '../helloasso/entities/helloasso-details.entity';
import { UserClubEntity } from '../auth/entities/user-club.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClubEntity,
      LicenceEntity,
      RaceEntity,
      CompetitionEntity,
      HelloAssoDetailsEntity,
      UserClubEntity,
    ]),
    AuthModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
