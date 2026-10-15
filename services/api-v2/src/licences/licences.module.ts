import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LicencesService } from './licences.service';
import { LicenceImportService } from './licence-import.service';
import { LicenceEligibilityService } from './licence-eligibility.service';
import { LicencesController } from './licences.controller';
import { LicenceEntity } from './entities/licence.entity';
import { ClubEntity } from '../clubs/entities/club.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { ChallengeArchiveRiderEntity } from '../challenges/entities/challenge-archive-rider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LicenceEntity,
      ClubEntity,
      RaceEntity,
      ChallengeArchiveRiderEntity,
      CompetitionEntity,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [LicencesController],
  providers: [LicencesService, LicenceImportService, LicenceEligibilityService],
  exports: [LicencesService],
})
export class LicencesModule {}
