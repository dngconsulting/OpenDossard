import { Module } from '@nestjs/common';

import { CsvReportsModule } from './csv/csv-reports.module';
import { PdfReportsModule } from './pdf/pdf-reports.module';

@Module({
  imports: [PdfReportsModule, CsvReportsModule],
})
export class ReportsModule {}
