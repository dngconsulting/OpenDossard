import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { ClubEntity } from '../clubs/entities/club.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionEntity, LicenceEntity, RaceEntity, ClubEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
