import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { HelloAssoPaymentEntity } from '../helloasso/entities/helloasso-payment.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { CompetitionEntity } from './entities/competition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompetitionEntity, RaceEntity, HelloAssoPaymentEntity]),
    AuthModule,
  ],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
