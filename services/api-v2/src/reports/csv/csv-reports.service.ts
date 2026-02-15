import { Injectable } from '@nestjs/common';

import { FilterLicenceDto } from '../../licences/dto';
import { LicencesService } from '../../licences/licences.service';
import { generateLicencesCSVBuffer } from './generators/licences-csv.generator';

@Injectable()
export class CsvReportsService {
  constructor(private readonly licencesService: LicencesService) {}

  async generateLicencesCSV(filterDto: FilterLicenceDto): Promise<Buffer> {
    const licences = await this.licencesService.findForExport(filterDto);
    return generateLicencesCSVBuffer(licences);
  }
}
