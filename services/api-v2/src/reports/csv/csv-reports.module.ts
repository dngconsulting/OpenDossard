import { Module } from '@nestjs/common';

import { ClubsModule } from '../../clubs/clubs.module';
import { LicencesModule } from '../../licences/licences.module';
import { CsvReportsController } from './csv-reports.controller';
import { CsvReportsService } from './csv-reports.service';

@Module({
  imports: [LicencesModule, ClubsModule],
  controllers: [CsvReportsController],
  providers: [CsvReportsService],
})
export class CsvReportsModule {}
