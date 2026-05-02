import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { EngageCsvRow, parseEngagesCsv } from './engages-csv.utils';
import { ImportEngageFieldDiffDto, ImportEngagesResultDto } from './dto/import-engages-result.dto';

@Injectable()
export class RaceImportService {
  private readonly logger = new Logger(RaceImportService.name);

  constructor(
    @InjectRepository(RaceEntity)
    private readonly raceRepository: Repository<RaceEntity>,
    @InjectRepository(LicenceEntity)
    private readonly licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async importFromCsv(
    competitionId: number,
    fileContent: string,
    author?: string,
  ): Promise<ImportEngagesResultDto> {
    const competition = await this.competitionRepository.findOne({ where: { id: competitionId } });
    if (!competition) {
      throw new NotFoundException(`Compétition ${competitionId} introuvable`);
    }

    let rows: EngageCsvRow[];
    try {
      rows = parseEngagesCsv(fileContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erreur de parsing CSV : ${message}`);
    }

    const result: ImportEngagesResultDto = {
      summary: {
        total: rows.length,
        inserted: 0,
        duplicates: 0,
        unknownLicences: 0,
        anomalies: 0,
      },
      details: { inserted: [], duplicates: [], unknownLicences: [], anomalies: [] },
    };

    // Pre-load licences by trimmed licenceNumber
    const licenceNumbers = [
      ...new Set(rows.map(r => r.licence?.trim()).filter((n): n is string => !!n)),
    ];
    const licenceByNumber = new Map<string, LicenceEntity>();
    if (licenceNumbers.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < licenceNumbers.length; i += chunkSize) {
        const chunk = licenceNumbers.slice(i, i + chunkSize);
        const licences = await this.licenceRepository.find({
          where: { licenceNumber: In(chunk) },
        });
        for (const l of licences) {
          if (l.licenceNumber) licenceByNumber.set(l.licenceNumber.trim(), l);
        }
      }
    }

    // Pre-load all races for this competition
    const existingRaces = await this.raceRepository.find({ where: { competitionId } });
    const racesByLicence = new Map<number, RaceEntity>();
    const racesByDossard = new Map<string, RaceEntity>();
    for (const r of existingRaces) {
      if (r.licenceId != null) racesByLicence.set(r.licenceId, r);
      if (r.riderNumber != null && r.raceCode) {
        racesByDossard.set(`${r.raceCode}_${r.riderNumber}`, r);
      }
    }

    const toInsert: RaceEntity[] = [];
    const insertedKeys = new Set<string>();

    for (const row of rows) {
      const licenceNumber = row.licence?.trim();
      const course = row.course?.trim();
      const nom = row.nom?.trim();

      const missingFields: string[] = [];
      if (!licenceNumber) missingFields.push('Licence');
      if (!course) missingFields.push('Course');
      if (!nom) missingFields.push('Nom');

      if (missingFields.length > 0) {
        result.details.anomalies.push({
          line: row.line,
          kind: 'missing',
          licenceNumber,
          rider: nom,
          missingFields,
        });
        continue;
      }

      const licence = licenceByNumber.get(licenceNumber!);
      if (!licence) {
        result.details.unknownLicences.push({
          line: row.line,
          licenceNumber: licenceNumber!,
          rider: nom!,
        });
        continue;
      }

      // Strict match — every CSV field must equal DB field
      const diffs = computeDiffs(row, licence);
      if (diffs.length > 0) {
        result.details.anomalies.push({
          line: row.line,
          kind: 'divergent',
          licenceNumber: licence.licenceNumber,
          rider: `${licence.name} ${licence.firstName}`,
          diffs,
        });
        continue;
      }

      // Duplicate: rider already engaged in this competition (any raceCode) — pre-existing OR same import
      const alreadyExisting = racesByLicence.get(licence.id);
      if (alreadyExisting) {
        result.details.duplicates.push({
          line: row.line,
          licenceNumber: licence.licenceNumber,
          rider: `${licence.name} ${licence.firstName}`,
          raceCode: course!,
          existingRaceCode: alreadyExisting.raceCode ?? '',
        });
        continue;
      }
      if (insertedKeys.has(`L_${licence.id}`)) {
        result.details.duplicates.push({
          line: row.line,
          licenceNumber: licence.licenceNumber,
          rider: `${licence.name} ${licence.firstName}`,
          raceCode: course!,
          existingRaceCode: course!,
        });
        continue;
      }

      // Dossard collision
      const dossard = parseDossard(row.dossard);
      if (dossard != null) {
        const collisionKey = `${course}_${dossard}`;
        const existingByDossard = racesByDossard.get(collisionKey);
        if (existingByDossard && existingByDossard.licenceId !== licence.id) {
          const otherLicence =
            existingByDossard.licence?.licenceNumber ??
            (await this.lookupLicenceNumber(existingByDossard.licenceId));
          result.details.anomalies.push({
            line: row.line,
            kind: 'dossardCollision',
            licenceNumber: licence.licenceNumber,
            rider: `${licence.name} ${licence.firstName}`,
            message: `Dossard ${dossard} déjà attribué à la licence ${otherLicence ?? '?'} sur la course ${course}`,
          });
          continue;
        }
        if (insertedKeys.has(`D_${course}_${dossard}`)) {
          result.details.anomalies.push({
            line: row.line,
            kind: 'dossardCollision',
            licenceNumber: licence.licenceNumber,
            rider: `${licence.name} ${licence.firstName}`,
            message: `Dossard ${dossard} dupliqué dans le CSV pour la course ${course}`,
          });
          continue;
        }
      }

      // OK — build entity
      const race = new RaceEntity();
      race.competitionId = competitionId;
      race.licenceId = licence.id;
      race.raceCode = course!;
      race.riderNumber = dossard;
      // CatéV : on garde la valeur du CSV telle quelle (catégorie de course),
      // jamais celle de la licence (référentiel fédération potentiellement différent).
      race.catev = row.catev?.trim() || null;
      race.catea = licence.catea ?? null;
      race.club = licence.club ?? null;
      toInsert.push(race);

      insertedKeys.add(`L_${licence.id}`);
      if (dossard != null) insertedKeys.add(`D_${course}_${dossard}`);

      result.details.inserted.push({
        line: row.line,
        riderNumber: dossard ?? undefined,
        rider: `${licence.name} ${licence.firstName}`,
        licenceNumber: licence.licenceNumber,
        raceCode: course!,
      });
    }

    if (toInsert.length > 0) {
      // Transaction : si l'insert bulk échoue, aucune ligne n'est persistée et
      // result.details.inserted reste cohérent avec l'état réel de la DB.
      await this.dataSource.transaction(async manager => {
        await manager.save(RaceEntity, toInsert);
      });
    }

    result.summary.inserted = result.details.inserted.length;
    result.summary.duplicates = result.details.duplicates.length;
    result.summary.unknownLicences = result.details.unknownLicences.length;
    result.summary.anomalies = result.details.anomalies.length;

    this.logger.log(
      `Import engagés competition=${competitionId} par ${author ?? '?'} | ` +
        `total=${result.summary.total} inserted=${result.summary.inserted} ` +
        `duplicates=${result.summary.duplicates} unknown=${result.summary.unknownLicences} ` +
        `anomalies=${result.summary.anomalies}`,
    );

    return result;
  }

  private async lookupLicenceNumber(licenceId: number | null): Promise<string | undefined> {
    if (licenceId == null) return undefined;
    const l = await this.licenceRepository.findOne({ where: { id: licenceId } });
    return l?.licenceNumber;
  }
}

function parseDossard(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function eqStr(a: string | undefined | null, b: string | undefined | null): boolean {
  return (a ?? '').trim() === (b ?? '').trim();
}

function computeDiffs(row: EngageCsvRow, licence: LicenceEntity): ImportEngageFieldDiffDto[] {
  const diffs: ImportEngageFieldDiffDto[] = [];
  const expectedNom = `${licence.name ?? ''} ${licence.firstName ?? ''}`.trim();

  if (!eqStr(row.nom, expectedNom)) {
    diffs.push({ field: 'Nom', csv: row.nom, db: expectedNom });
  }
  if (!eqStr(row.club, licence.club)) {
    diffs.push({ field: 'Club', csv: row.club, db: licence.club ?? undefined });
  }
  if (!eqStr(row.sexe, licence.gender)) {
    diffs.push({ field: 'Sexe', csv: row.sexe, db: licence.gender ?? undefined });
  }
  if (!eqStr(row.dept, licence.dept)) {
    diffs.push({ field: 'Dept', csv: row.dept, db: licence.dept ?? undefined });
  }
  if (!eqStr(row.annee, licence.birthYear)) {
    diffs.push({ field: 'Année', csv: row.annee, db: licence.birthYear ?? undefined });
  }
  if (!eqStr(row.catea, licence.catea)) {
    diffs.push({ field: 'CatéA', csv: row.catea, db: licence.catea ?? undefined });
  }
  // CatéV (catégorie de valeur / niveau course) volontairement non comparée :
  // la valeur du CSV vient de race.catev (figée à l'engagement, fédération de la course)
  // et n'est pas comparable à licence.catev (fédération de licence, potentiellement différente).
  if (!eqStr(row.fede, licence.fede)) {
    diffs.push({ field: 'Fédé', csv: row.fede, db: licence.fede ?? undefined });
  }

  return diffs;
}
