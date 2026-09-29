import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengeLiveRankingService } from './challenge-live-ranking.service';
import { ChallengesController } from './challenges.controller';
import { ChallengeEntity } from './entities/challenge.entity';
import { ChallengeArchiveRiderEntity } from './entities/challenge-archive-rider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeEntity, ChallengeArchiveRiderEntity])],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengeLiveRankingService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
