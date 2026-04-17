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

    // b) Requête optimisée en une seule passe avec window functions PostgreSQL.
    //
    // Stratégie :
    //  1. CTE `rider_races` : récupère les triplets (competition_id, race_code, catev)
    //     du coureur — scan via index licence_id, ensemble très restreint.
    //  2. CTE `peers` : ramène toutes les lignes de race appartenant à ces mêmes
    //     triplets (= les "concurrents directs" du coureur dans chacun de ses départs).
    //     On réduit ainsi drastiquement le volume scanné par le windowing.
    //  3. CTE `ranked` : calcule en une seule passe :
    //       - rankingInCategory  = ROW_NUMBER() partitionné par (compet, départ, catev),
    //         ordonné par ranking_scratch — NULL pour les commentés (non classés au rang).
    //       - totalInCategory    = COUNT(*) partitionné identiquement — compte finishers
    //         ET commentés (ABD, NC, DSQ…), conformément à la sémantique demandée.
    //  4. SELECT final : ne garde que les lignes du coureur, joint la compétition.
    //
    // Comparé à l'ancienne version (deux sous-requêtes corrélées par ligne, soit
    // O(n) round-trips logiques côté planner), cette version est O(P log P) où P
    // est le nombre total de participants dans les départs où le coureur a couru.
    // Compatible avec NULL sur race_code/catev grâce à IS NOT DISTINCT FROM.
    const query = `
      WITH rider_races AS (
        SELECT DISTINCT competition_id, race_code, catev
        FROM race
        WHERE licence_id = $1
          AND (ranking_scratch IS NOT NULL OR comment IS NOT NULL)
      ),
      peers AS (
        SELECT r.*
        FROM race r
        JOIN rider_races rr
          ON r.competition_id = rr.competition_id
         AND r.race_code IS NOT DISTINCT FROM rr.race_code
         AND r.catev      IS NOT DISTINCT FROM rr.catev
        WHERE r.ranking_scratch IS NOT NULL OR r.comment IS NOT NULL
      ),
      ranked AS (
        SELECT
          p.*,
          CASE
            WHEN p.comment IS NULL AND p.ranking_scratch IS NOT NULL THEN
              ROW_NUMBER() OVER (
                PARTITION BY p.competition_id, p.race_code, p.catev
                ORDER BY p.ranking_scratch
              )
            ELSE NULL
          END AS "rankingInCategory",
          COUNT(*) OVER (
            PARTITION BY p.competition_id, p.race_code, p.catev
          ) AS "totalInCategory"
        FROM peers p
      )
      SELECT
        ranked.id,
        ranked.competition_id           AS "competitionId",
        c.event_date                    AS "date",
        c.name                          AS "competitionName",
        c.competition_type              AS "competitionType",
        ranked.race_code                AS "raceCode",
        ranked.ranking_scratch          AS "rankingScratch",
        ranked.comment,
        ranked.catev,
        ranked.catea,
        ranked.club,
        ranked.sprintchallenge,
        ranked."rankingInCategory",
        ranked."totalInCategory"
      FROM ranked
      JOIN competition c ON c.id = ranked.competition_id
      WHERE ranked.licence_id = $1
      ORDER BY c.event_date DESC, ranked.id DESC
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
      catea: string | null;
      club: string | null;
      sprintchallenge: boolean | null;
      rankingInCategory: number | null;
      totalInCategory: number;
    }> = await this.dataSource.query(query, [licenceId]);

    // c) Compute stats — COUNT(*) returns bigint which pg driver serializes as string
    const ranked = rows
      .filter(r => r.rankingInCategory != null)
      .map(r => ({ ...r, rankingInCategory: Number(r.rankingInCategory) }));
    const stats: PalmaresStatsDto = {
      totalRaces: rows.length,
      wins: ranked.filter(r => r.rankingInCategory === 1).length,
      podiums: ranked.filter(r => r.rankingInCategory <= 3).length,
      topTen: ranked.filter(r => r.rankingInCategory <= 10).length,
      bestRanking: ranked.length > 0 ? Math.min(...ranked.map(r => r.rankingInCategory)) : 0,
    };

    // d) Compute categoryHistory per discipline (route vs CX)
    const sortedAsc = [...rows].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dateCompare !== 0 ? dateCompare : a.id - b.id;
    });

    const buildCategoryHistory = (races: typeof sortedAsc): PalmaresCategoryChangeDto[] => {
      const history: PalmaresCategoryChangeDto[] = [];
      let lastCatev: string | null = null;

      for (const row of races) {
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

          history.push({
            season,
            fromCategory: lastCatev,
            toCategory: row.catev,
            direction,
          });

          lastCatev = row.catev;
        }
      }

      return history;
    };

    const uniqueTypes = [...new Set(sortedAsc.map(r => r.competitionType))];
    const categoryHistory: Record<string, PalmaresCategoryChangeDto[]> = {};
    for (const type of uniqueTypes) {
      categoryHistory[type] = buildCategoryHistory(
        sortedAsc.filter(r => r.competitionType === type),
      );
    }

    // e) Map rows to PalmaresResultDto[]
    const results: PalmaresResultDto[] = rows.map(r => ({
      id: r.id,
      competitionId: r.competitionId,
      date: r.date,
      competitionName: r.competitionName,
      competitionType: r.competitionType,
      raceCode: r.raceCode,
      catev: r.catev,
      catea: r.catea,
      club: r.club,
      rankingScratch: r.rankingScratch,
      rankingInCategory: r.rankingInCategory != null ? Number(r.rankingInCategory) : null,
      totalInCategory: Number(r.totalInCategory),
      comment: r.comment,
      sprintchallenge: r.sprintchallenge,
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
