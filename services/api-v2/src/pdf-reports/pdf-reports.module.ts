import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { PdfReportsController } from './pdf-reports.controller';
import { PdfReportsService } from './pdf-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionEntity])],
  controllers: [PdfReportsController],
  providers: [PdfReportsService],
})
export class PdfReportsModule {}
