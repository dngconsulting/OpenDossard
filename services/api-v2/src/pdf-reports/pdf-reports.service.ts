import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { generateFicheEpreuvePDF } from './generators/fiche-epreuve.generator';

@Injectable()
export class PdfReportsService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
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
}
