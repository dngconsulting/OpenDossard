import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesService } from './races.service';
import { RacesController } from './races.controller';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RaceEntity, LicenceEntity, CompetitionEntity]),
  ],
  controllers: [RacesController],
  providers: [RacesService],
  exports: [RacesService],
})
export class RacesModule {}
