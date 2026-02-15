import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClubsModule } from '../../clubs/clubs.module';
import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { LicencesModule } from '../../licences/licences.module';
import { PdfReportsController } from './pdf-reports.controller';
import { PdfReportsService } from './pdf-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionEntity]), LicencesModule, ClubsModule],
  controllers: [PdfReportsController],
  providers: [PdfReportsService],
})
export class PdfReportsModule {}
