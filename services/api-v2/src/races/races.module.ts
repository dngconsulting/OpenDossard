import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesService } from './races.service';
import { RacesController } from './races.controller';
import { RaceResultsController } from './race-results.controller';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { PalmaresService } from './palmares.service';
import { RankingService } from './ranking.service';
import { ResultsCsvService } from './results-csv.service';
import { RaceImportService } from './race-import.service';

@Module({
  imports: [TypeOrmModule.forFeature([RaceEntity, LicenceEntity, CompetitionEntity])],
  controllers: [RacesController, RaceResultsController],
  providers: [RacesService, PalmaresService, RankingService, ResultsCsvService, RaceImportService],
  exports: [RacesService, PalmaresService, RankingService, ResultsCsvService, RaceImportService],
})
export class RacesModule {}
