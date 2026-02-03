import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RaceEntity } from './entities/race.entity';

@Injectable()
export class ResultsCsvService {
  constructor(
    @InjectRepository(RaceEntity)
    private readonly raceRepository: Repository<RaceEntity>,
  ) {}

  /**
   * Upload des résultats CSV pour une compétition
   * Format CSV attendu : Dossard;Chrono;Tours;Classement (séparateur ;)
   * Classement peut être un nombre ou un code : ABD, DSQ, NC, NP, CHT
   */
  async uploadResultsCsv(
    competitionId: number,
    file: Express.Multer.File,
  ): Promise<{ processed: number; errors: string[] }> {
    const VALID_COMMENTS = ['ABD', 'DSQ', 'NC', 'NP', 'CHT'];
    const results = this.parseCsvBuffer(file.buffer);
    const errors: string[] = [];

    // Vérifier la consécutivité des classements numériques
    for (let i = 0; i < results.length; i++) {
      const rank = parseInt(results[i].Classement, 10);
      if (!isNaN(rank) && rank !== i + 1) {
        throw new BadRequestException(
          `Le classement du Dossard ${results[i].Dossard} n'est pas consécutif : classement=${rank}, attendu=${i + 1}`,
        );
      }
    }

    // Traiter chaque ligne
    for (const row of results) {
      const race = await this.raceRepository.findOne({
        where: {
          riderNumber: parseInt(row.Dossard, 10),
          competitionId,
        },
      });

      if (!race) {
        errors.push(`Dossard ${row.Dossard} non trouvé`);
        continue;
      }

      race.chrono = row.Chrono || null;

      const tours = parseInt(row.Tours as unknown as string, 10);
      race.tours = isNaN(tours) ? null : tours;

      const rank = parseInt(row.Classement, 10);
      if (isNaN(rank)) {
        if (VALID_COMMENTS.includes(row.Classement)) {
          race.comment = row.Classement;
        } else {
          errors.push(
            `Dossard ${row.Dossard} : classement invalide "${row.Classement}"`,
          );
          continue;
        }
      } else {
        race.rankingScratch = rank;
      }

      await this.raceRepository.save(race);
    }

    return { processed: results.length, errors };
  }

  private parseCsvBuffer(
    buffer: Buffer,
  ): { Dossard: string; Chrono: string; Tours: string; Classement: string }[] {
    const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      throw new BadRequestException('Le fichier CSV est vide ou ne contient que l\'en-tête');
    }

    const headers = lines[0].split(';').map((h) => h.trim());
    const required = ['Dossard', 'Chrono', 'Tours', 'Classement'];
    for (const col of required) {
      if (!headers.includes(col)) {
        throw new BadRequestException(`Colonne manquante dans le CSV : ${col}`);
      }
    }

    return lines.slice(1).map((line) => {
      const values = line.split(';');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = (values[i] ?? '').trim()));
      return row as { Dossard: string; Chrono: string; Tours: string; Classement: string };
    });
  }
}
