import { Module } from '@nestjs/common';

import { LicencesModule } from '../../licences/licences.module';
import { CsvReportsController } from './csv-reports.controller';
import { CsvReportsService } from './csv-reports.service';

@Module({
  imports: [LicencesModule],
  controllers: [CsvReportsController],
  providers: [CsvReportsService],
})
export class CsvReportsModule {}
