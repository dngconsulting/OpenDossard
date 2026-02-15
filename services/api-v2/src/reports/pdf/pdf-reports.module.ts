import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { LicencesModule } from '../../licences/licences.module';
import { PdfReportsController } from './pdf-reports.controller';
import { PdfReportsService } from './pdf-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionEntity]), LicencesModule],
  controllers: [PdfReportsController],
  providers: [PdfReportsService],
})
export class PdfReportsModule {}
