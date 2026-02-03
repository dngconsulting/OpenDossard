import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LicenceEntity } from '../licences/entities/licence.entity';
import {
  PalmaresResponseDto,
  PalmaresResultDto,
  PalmaresStatsDto,
  PalmaresCategoryChangeDto,
} from './dto';

@Injectable()
export class PalmaresService {
  constructor(
    @InjectRepository(LicenceEntity)
    private readonly licenceRepository: Repository<LicenceEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Récupère le palmarès d'un coureur avec stats, historique catégories et résultats
   */
  async getPalmares(licenceId: number): Promise<PalmaresResponseDto> {
    // a) Fetch licence
    const licence = await this.licenceRepository.findOne({ where: { id: licenceId } });
    if (!licence) {
      throw new NotFoundException(`Licence with ID ${licenceId} not found`);
    }

    // b) Single SQL query with rankingInCategory and totalInCategory
    const query = `
      SELECT
        r.id,
        r.competition_id AS "competitionId",
        c.event_date AS "date",
        c.name AS "competitionName",
        c.competition_type AS "competitionType",
        r.race_code AS "raceCode",
        r.ranking_scratch AS "rankingScratch",
        r.comment,
        r.catev,
        CASE
          WHEN r.ranking_scratch IS NOT NULL AND r.comment IS NULL THEN
            (SELECT COUNT(*)
             FROM race rr
             WHERE rr.competition_id = r.competition_id
               AND rr.race_code = r.race_code
               AND rr.catev = r.catev
               AND rr.ranking_scratch IS NOT NULL
               AND rr.comment IS NULL
               AND rr.ranking_scratch <= r.ranking_scratch)
          ELSE NULL
        END AS "rankingInCategory",
        (SELECT COUNT(*)
         FROM race rr
         WHERE rr.competition_id = r.competition_id
           AND rr.race_code = r.race_code
           AND rr.catev = r.catev
           AND rr.ranking_scratch IS NOT NULL
           AND rr.comment IS NULL) AS "totalInCategory"
      FROM race r
      JOIN competition c ON r.competition_id = c.id
      WHERE r.licence_id = $1
        AND (r.ranking_scratch IS NOT NULL OR r.comment IS NOT NULL)
      ORDER BY c.event_date DESC, r.id DESC
    `;

    const rows: Array<{
      id: number;
      competitionId: number;
      date: string;
      competitionName: string;
      competitionType: string;
      raceCode: string;
      rankingScratch: number | null;
      comment: string | null;
      catev: string;
      rankingInCategory: number | null;
      totalInCategory: number;
    }> = await this.dataSource.query(query, [licenceId]);

    // c) Compute stats — COUNT(*) returns bigint which pg driver serializes as string
    const ranked = rows
      .filter((r) => r.rankingInCategory != null)
      .map((r) => ({ ...r, rankingInCategory: Number(r.rankingInCategory) }));
    const stats: PalmaresStatsDto = {
      totalRaces: rows.length,
      wins: ranked.filter((r) => r.rankingInCategory === 1).length,
      podiums: ranked.filter((r) => r.rankingInCategory <= 3).length,
      topTen: ranked.filter((r) => r.rankingInCategory <= 10).length,
      bestRanking: ranked.length > 0
        ? Math.min(...ranked.map((r) => r.rankingInCategory))
        : 0,
    };

    // d) Compute categoryHistory — every catev change chronologically
    const sortedAsc = [...rows].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dateCompare !== 0 ? dateCompare : a.id - b.id;
    });

    const categoryHistory: PalmaresCategoryChangeDto[] = [];
    let lastCatev: string | null = null;

    for (const row of sortedAsc) {
      if (row.catev && row.catev !== lastCatev) {
        const season = new Date(row.date).getFullYear().toString();
        let direction: 'up' | 'down' | 'initial' = 'initial';

        if (lastCatev !== null) {
          const oldNum = parseInt(lastCatev.replace(/\D/g, ''), 10);
          const newNum = parseInt(row.catev.replace(/\D/g, ''), 10);
          if (!isNaN(oldNum) && !isNaN(newNum)) {
            direction = newNum < oldNum ? 'up' : 'down';
          }
        }

        categoryHistory.push({
          season,
          fromCategory: lastCatev,
          toCategory: row.catev,
          direction,
        });

        lastCatev = row.catev;
      }
    }

    // e) Map rows to PalmaresResultDto[]
    const results: PalmaresResultDto[] = rows.map((r) => ({
      id: r.id,
      competitionId: r.competitionId,
      date: r.date,
      competitionName: r.competitionName,
      competitionType: r.competitionType,
      raceCode: r.raceCode,
      catev: r.catev,
      rankingScratch: r.rankingScratch,
      rankingInCategory: r.rankingInCategory != null ? Number(r.rankingInCategory) : null,
      totalInCategory: Number(r.totalInCategory),
      comment: r.comment,
    }));

    // f) Return full response
    return { licence, stats, categoryHistory, results };
  }

  /**
   * Recherche des licences ayant un palmarès (au moins une course)
   */
  async getLicencesWithPalmares(searchQuery: string): Promise<LicenceEntity[]> {
    const normalizedQuery =
      '%' +
      searchQuery
        .replace(/\s+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') +
      '%';

    const query = `
      SELECT DISTINCT
        l.id,
        l.licence_number AS "licenceNumber",
        l.club,
        l.gender,
        l.name,
        l.dept,
        l.fede,
        l.first_name AS "firstName",
        l.birth_year AS "birthYear",
        l.saison,
        l.catea
      FROM licence l
      JOIN race r ON r.licence_id = l.id
      WHERE REPLACE(CONCAT(UPPER(l.name), UPPER(unaccent(l.first_name))), ' ', '') LIKE $1
         OR REPLACE(CONCAT(UPPER(unaccent(l.first_name)), UPPER(l.name)), ' ', '') LIKE $1
      ORDER BY l.name
      FETCH FIRST 30 ROWS ONLY
    `;

    return this.dataSource.query(query, [normalizedQuery]);
  }
}
