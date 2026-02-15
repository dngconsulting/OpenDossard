import { Injectable } from '@nestjs/common';

import { FilterClubDto } from '../../clubs/dto/filter-club.dto';
import { ClubsService } from '../../clubs/clubs.service';
import { FilterLicenceDto } from '../../licences/dto';
import { LicencesService } from '../../licences/licences.service';
import { generateClubsCSVBuffer } from './generators/clubs-csv.generator';
import { generateLicencesCSVBuffer } from './generators/licences-csv.generator';

@Injectable()
export class CsvReportsService {
  constructor(
    private readonly licencesService: LicencesService,
    private readonly clubsService: ClubsService,
  ) {}

  async generateLicencesCSV(filterDto: FilterLicenceDto): Promise<Buffer> {
    const licences = await this.licencesService.findForExport(filterDto);
    return generateLicencesCSVBuffer(licences);
  }

  async generateClubsCSV(filterDto: FilterClubDto): Promise<Buffer> {
    const clubs = await this.clubsService.findForExport(filterDto);
    return generateClubsCSVBuffer(clubs);
  }
}
