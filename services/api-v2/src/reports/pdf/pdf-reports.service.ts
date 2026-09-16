import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FilterClubDto } from '../../clubs/dto/filter-club.dto';
import { ClubsService } from '../../clubs/clubs.service';
import { CompetitionEntity } from '../../competitions/entities/competition.entity';
import { FilterLicenceDto } from '../../licences/dto';
import { LicencesService } from '../../licences/licences.service';
import { RacesService } from '../../races/races.service';
import { generateClassementsPDF } from './generators/classements-pdf.generator';
import { generateClubsPDFBuffer } from './generators/clubs-pdf.generator';
import { generateFicheEpreuvePDF } from './generators/fiche-epreuve.generator';
import { generateLicencesPDFBuffer } from './generators/licences-pdf.generator';

@Injectable()
export class PdfReportsService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    private readonly licencesService: LicencesService,
    private readonly clubsService: ClubsService,
    private readonly racesService: RacesService,
  ) {}

  /** Charge l'épreuve avec son club organisateur, 404 si elle n'existe pas. */
  private async loadCompetitionOrThrow(competitionId: number): Promise<CompetitionEntity> {
    const competition = await this.competitionRepository.findOne({
      where: { id: competitionId },
      relations: ['club'],
    });

    if (!competition) {
      throw new NotFoundException(`Competition #${competitionId} not found`);
    }

    return competition;
  }

  async generateFicheEpreuve(competitionId: number): Promise<Buffer> {
    const competition = await this.loadCompetitionOrThrow(competitionId);
    return generateFicheEpreuvePDF(competition);
  }

  async generateClassementsPDF(competitionId: number): Promise<Buffer> {
    const competition = await this.loadCompetitionOrThrow(competitionId);
    const rows = await this.racesService.findByCompetition(competitionId);
    return generateClassementsPDF(competition, rows);
  }

  async generateLicencesPDF(filterDto: FilterLicenceDto): Promise<Buffer> {
    const licences = await this.licencesService.findForExport(filterDto);
    return generateLicencesPDFBuffer(licences);
  }

  async generateClubsPDF(filterDto: FilterClubDto): Promise<Buffer> {
    const clubs = await this.clubsService.findForExport(filterDto);
    return generateClubsPDFBuffer(clubs);
  }
}
