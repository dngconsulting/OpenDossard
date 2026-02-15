import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { FilterLicenceDto } from '../../licences/dto';
import { LicencesService } from '../../licences/licences.service';
import { generateFicheEpreuvePDF } from './generators/fiche-epreuve.generator';
import { generateLicencesPDFBuffer } from './generators/licences-pdf.generator';

@Injectable()
export class PdfReportsService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    private readonly licencesService: LicencesService,
  ) {}

  async generateFicheEpreuve(competitionId: number): Promise<Buffer> {
    const competition = await this.competitionRepository.findOne({
      where: { id: competitionId },
      relations: ['club'],
    });

    if (!competition) {
      throw new NotFoundException(`Competition #${competitionId} not found`);
    }

    return generateFicheEpreuvePDF(competition);
  }

  async generateLicencesPDF(filterDto: FilterLicenceDto): Promise<Buffer> {
    const licences = await this.licencesService.findForExport(filterDto);
    return generateLicencesPDFBuffer(licences);
  }
}
