import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GpxTracesModule } from '../gpx-traces/gpx-traces.module';
import { HelloAssoDetailsEntity } from '../helloasso/entities/helloasso-details.entity';
import { HelloAssoPaymentEntity } from '../helloasso/entities/helloasso-payment.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { CompetitionEntity } from './entities/competition.entity';
import { OnlinePaymentActivationPolicy } from './online-payment-activation.policy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompetitionEntity,
      RaceEntity,
      HelloAssoPaymentEntity,
      HelloAssoDetailsEntity,
    ]),
    AuthModule,
    GpxTracesModule,
  ],
  controllers: [CompetitionsController],
  providers: [CompetitionsService, OnlinePaymentActivationPolicy],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
