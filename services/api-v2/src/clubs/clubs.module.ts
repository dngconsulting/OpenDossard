import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ClubEntity } from './entities/club.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClubEntity, LicenceEntity, RaceEntity, CompetitionEntity])],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
