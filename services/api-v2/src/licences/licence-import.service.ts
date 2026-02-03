import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicenceEntity } from './entities/licence.entity';
import { ClubEntity } from '../clubs/entities/club.entity';
import { ImportResultDto } from './dto';
import {
  computeCateaFromBirthYear,
  extractBirthYear,
  formatDepartement,
  parseElicenceCsv,
} from './elicence-csv.utils';
import { Federation } from '../common/enums';

@Injectable()
export class LicenceImportService {
  constructor(
    @InjectRepository(LicenceEntity)
    private readonly licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(ClubEntity)
    private readonly clubRepository: Repository<ClubEntity>,
  ) {}

  /**
   * Import licences from e-licence CSV file
   */
  async importFromCsv(fileContent: string, author?: string): Promise<ImportResultDto> {
    const rows = parseElicenceCsv(fileContent);

    const result: ImportResultDto = {
      summary: { total: rows.length, created: 0, updated: 0, unchanged: 0, skipped: 0 },
      details: { created: [], updated: [], warnings: [], skipped: [] },
    };

    for (const row of rows) {
      if (
        !row.licenceNumber ||
        !row.firstName ||
        !row.name ||
        !row.gender ||
        !row.elicenceClubName ||
        !row.saison
      ) {
        result.summary.skipped++;
        result.details.skipped.push({
          rider: `${row.firstName ?? '?'} ${row.name ?? '?'}`,
          reason:
            'Champs obligatoires manquants (numéro, prénom, nom, genre, club elicence ou saison)',
        });
        continue;
      }

      const changes: string[] = [];

      // 1. Search by licence number (FSGT only)
      let existing = await this.licenceRepository.findOne({
        where: { licenceNumber: row.licenceNumber, fede: Federation.FSGT },
      });

      // 2. Fallback: search by birthYear + name + firstName
      if (!existing && row.birthDay) {
        const birthYear = extractBirthYear(row.birthDay);
        existing = await this.licenceRepository
          .createQueryBuilder('l')
          .where(
            "REPLACE(LOWER(unaccent(l.firstName)), '-', ' ') = LOWER(:firstName) AND l.name = :name AND l.birthYear = :birthYear AND l.fede = 'FSGT'",
            {
              firstName: row.firstName
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/-/g, ' ')
                .toLowerCase(),
              name: row.name,
              birthYear,
            },
          )
          .getOne();
      }

      if (existing) {
        await this.updateExistingLicence(existing, row, changes, result, author);
      } else {
        await this.createNewLicence(row, result, author);
      }
    }

    return result;
  }

  private async updateExistingLicence(
    existing: LicenceEntity,
    row: ReturnType<typeof parseElicenceCsv>[number],
    changes: string[],
    result: ImportResultDto,
    author?: string,
  ): Promise<void> {
    // Club
    if (row.elicenceClubName) {
      const club = await this.clubRepository.findOne({
        where: { elicenceName: row.elicenceClubName },
      });
      if (club && club.longName && existing.club !== club.longName) {
        changes.push(`club: ${existing.club ?? '∅'} → ${club.longName}`);
        existing.club = club.longName;
      }
    }
    // Licence number
    if (row.licenceNumber && existing.licenceNumber !== row.licenceNumber) {
      changes.push(`n°: ${existing.licenceNumber ?? '∅'} → ${row.licenceNumber}`);
      existing.licenceNumber = row.licenceNumber;
    }
    // FirstName
    if (row.firstName && existing.firstName?.trim() !== row.firstName) {
      changes.push(`prénom: ${existing.firstName} → ${row.firstName}`);
      existing.firstName = row.firstName;
    }
    // Name
    if (row.name && existing.name?.trim() !== row.name) {
      changes.push(`nom: ${existing.name} → ${row.name}`);
      existing.name = row.name;
    }
    // Saison
    if (row.saison && existing.saison?.trim() !== row.saison) {
      changes.push(`saison: ${existing.saison ?? '∅'} → ${row.saison}`);
      existing.saison = row.saison;
    }
    // Catev Route — warn if conflict, set if empty
    if (row.catev) {
      if (!existing.catev) {
        changes.push(`catev: ∅ → ${row.catev}`);
        existing.catev = row.catev;
      } else if (existing.catev !== row.catev) {
        result.details.warnings.push({
          licenceNumber: existing.licenceNumber,
          name: existing.name,
          firstName: existing.firstName,
          message: `Catégorie Route OD "${existing.catev}" ≠ elicence "${row.catev}"`,
        });
      }
    }
    // Catev CX
    if (row.catevCX) {
      if (!existing.catevCX) {
        changes.push(`catevCX: ∅ → ${row.catevCX}`);
        existing.catevCX = row.catevCX;
      } else if (existing.catevCX !== row.catevCX) {
        result.details.warnings.push({
          licenceNumber: existing.licenceNumber,
          name: existing.name,
          firstName: existing.firstName,
          message: `Catégorie CX OD "${existing.catevCX}" ≠ elicence "${row.catevCX}"`,
        });
      }
    }
    // Catea (from birthYear + gender)
    if (row.birthDay && row.gender) {
      const birthYear = extractBirthYear(row.birthDay);
      const catea = computeCateaFromBirthYear(birthYear, row.gender);
      if (catea && catea !== existing.catea) {
        changes.push(`catéA: ${existing.catea ?? '∅'} → ${catea}`);
        existing.catea = catea;
      }
    }
    // BirthYear
    if (row.birthDay) {
      const birthYear = extractBirthYear(row.birthDay);
      if (birthYear !== existing.birthYear) {
        changes.push(`année naiss.: ${existing.birthYear ?? '∅'} → ${birthYear}`);
        existing.birthYear = birthYear;
      }
    }
    // Dept
    if (row.dept) {
      const formatted = formatDepartement(row.dept);
      if (formatted !== existing.dept) {
        changes.push(`dept: ${existing.dept ?? '∅'} → ${formatted}`);
        existing.dept = formatted;
      }
    }

    if (changes.length > 0) {
      existing.lastChanged = new Date();
      existing.author = author ? `${author}/ImportCSV` : 'ImportCSV';
      await this.licenceRepository.save(existing);
      result.summary.updated++;
      result.details.updated.push({
        licenceNumber: existing.licenceNumber,
        name: existing.name,
        firstName: existing.firstName,
        changes,
      });
    } else {
      result.summary.unchanged++;
    }
  }

  private async createNewLicence(
    row: ReturnType<typeof parseElicenceCsv>[number],
    result: ImportResultDto,
    author?: string,
  ): Promise<void> {
    const club = await this.clubRepository.findOne({
      where: { elicenceName: row.elicenceClubName },
    });
    if (!club) {
      result.summary.skipped++;
      result.details.skipped.push({
        rider: `${row.firstName} ${row.name} (${row.licenceNumber})`,
        reason: `Club "${row.elicenceClubName}" introuvable`,
      });
      return;
    }

    const birthYear = row.birthDay ? extractBirthYear(row.birthDay) : undefined;
    const catea =
      birthYear && row.gender ? computeCateaFromBirthYear(birthYear, row.gender!) || 'NC' : 'NC';

    const newLicence = this.licenceRepository.create({
      licenceNumber: row.licenceNumber,
      firstName: row.firstName,
      name: row.name,
      gender: row.gender,
      club: club.longName,
      dept: row.dept ? formatDepartement(row.dept) : undefined,
      birthYear,
      catea,
      catev: row.catev || undefined,
      catevCX: row.catevCX || undefined,
      fede: Federation.FSGT,
      saison: row.saison,
      lastChanged: new Date(),
      author: author ? `${author}/ImportCSV` : 'ImportCSV',
    });

    await this.licenceRepository.save(newLicence);
    result.summary.created++;
    result.details.created.push({
      licenceNumber: newLicence.licenceNumber,
      name: newLicence.name,
      firstName: newLicence.firstName,
      club: newLicence.club,
    });
  }
}
