import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { ClubEntity } from '../clubs/entities/club.entity';
import { DashboardChartFiltersDto } from './dto/dashboard-chart-filters.dto';
import { ClubPerformanceDto } from './dto/club-performance.dto';

export interface DashboardStats {
  totalCompetitions: number;
  upcomingCompetitions: number;
  pastCompetitions: number;
  totalLicences: number;
  totalRaces: number;
  totalClubs: number;
  competitionsByFederation: { federation: string; count: number }[];
  competitionsByType: { type: string; count: number }[];
  competitionsByMonth: { month: string; count: number }[];
  licencesByFederation: { federation: string; count: number }[];
}

export interface DashboardSummary {
  stats: {
    totalLicenses: number;
    totalCompetitions: number;
  };
}

export interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  federation?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CompetitionEntity)
    private competitionRepository: Repository<CompetitionEntity>,
    @InjectRepository(LicenceEntity)
    private licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(RaceEntity)
    private raceRepository: Repository<RaceEntity>,
    @InjectRepository(ClubEntity)
    private clubRepository: Repository<ClubEntity>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private applyChartFilters(
    qb: SelectQueryBuilder<RaceEntity>,
    filters: DashboardChartFiltersDto,
  ): SelectQueryBuilder<RaceEntity> {
    if (filters.startDate) {
      qb.andWhere('DATE(competition.eventDate) >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('DATE(competition.eventDate) <= :endDate', { endDate: filters.endDate });
    }
    if (filters.fedes?.length) {
      qb.andWhere('competition.fede IN (:...fedes)', { fedes: filters.fedes });
    }
    if (filters.competitionTypes?.length) {
      qb.andWhere('competition.competitionType IN (:...competitionTypes)', {
        competitionTypes: filters.competitionTypes,
      });
    }
    if (filters.competitionDepts?.length) {
      qb.andWhere('competition.dept IN (:...competitionDepts)', {
        competitionDepts: filters.competitionDepts,
      });
    }
    if (filters.riderDepts?.length) {
      qb.andWhere('licence.dept IN (:...riderDepts)', { riderDepts: filters.riderDepts });
    }
    if (filters.clubs?.length) {
      qb.andWhere('race.club IN (:...clubs)', { clubs: filters.clubs });
    }

    if (filters.clubFede) {
      qb.andWhere('licence.fede::text = :clubFede', { clubFede: filters.clubFede });
      qb.andWhere('competition.fede::text = :clubFede', { clubFede: filters.clubFede });
    }
    return qb;
  }

  private createBaseChartQuery(filters: DashboardChartFiltersDto): SelectQueryBuilder<RaceEntity> {
    const qb = this.raceRepository
      .createQueryBuilder('race')
      .innerJoin('race.competition', 'competition')
      .leftJoin('race.licence', 'licence');
    return this.applyChartFilters(qb, filters);
  }

  async getRidersPerCompetition(
    filters: DashboardChartFiltersDto,
  ): Promise<{ name: string; eventDate: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select('competition.name', 'name')
      .addSelect('competition.eventDate', 'eventDate')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('competition.id')
      .addGroupBy('competition.name')
      .addGroupBy('competition.eventDate')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany();

    return results.map(r => ({
      name: r.name,
      eventDate: r.eventDate,
      count: parseInt(r.count, 10),
    }));
  }

  async getClubParticipation(
    filters: DashboardChartFiltersDto,
  ): Promise<{ club: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select("COALESCE(NULLIF(race.club, ''), 'Non Licenciés')", 'club')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('race.club')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany();

    return results.map(r => ({ club: r.club, count: parseInt(r.count, 10) }));
  }

  async getCateaDistribution(
    filters: DashboardChartFiltersDto,
  ): Promise<{ catea: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select("COALESCE(NULLIF(race.catea, ''), 'Non défini')", 'catea')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('race.catea')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map(r => ({ catea: r.catea, count: parseInt(r.count, 10) }));
  }

  async getCatevDistribution(
    filters: DashboardChartFiltersDto,
  ): Promise<{ catev: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select("COALESCE(NULLIF(race.catev, ''), 'Non défini')", 'catev')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('race.catev')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map(r => ({ catev: r.catev, count: parseInt(r.count, 10) }));
  }

  async getTopRiders(
    filters: DashboardChartFiltersDto,
    limit: number = 50,
  ): Promise<{ name: string; firstName: string; club: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select('licence.name', 'name')
      .addSelect('licence.firstName', 'firstName')
      .addSelect('licence.club', 'club')
      .addSelect('COUNT(race.id)', 'count')
      .andWhere('licence.id IS NOT NULL')
      .groupBy('licence.id')
      .addGroupBy('licence.name')
      .addGroupBy('licence.firstName')
      .addGroupBy('licence.club')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map(r => ({
      name: r.name,
      firstName: r.firstName,
      club: r.club,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Bilan « Performances du club » : victoires, deuxièmes et troisièmes places
   * et challenges sprint des coureurs d'un club, ventilés par catégorie.
   *
   * Le rang exploité est le rang **dans la catégorie**, pas `ranking_scratch`.
   * Deux raisons :
   *  1. Sémantique — plusieurs catégories partagent souvent un même départ. Un
   *     coureur 5e scratch peut être 1er de sa catégorie, et c'est bien ce que
   *     la fiche palmarès du coureur affiche déjà (cf. PalmaresService).
   *  2. Fiabilité — `ranking_scratch` est corrompu en magnitude sur une partie
   *     du parc (valeurs de l'ordre de 211 / 2193 / 4268, héritées d'un
   *     ROW_NUMBER() global sans PARTITION BY). L'ordre relatif, lui, est resté
   *     juste : un ROW_NUMBER() repartitionné redonne le bon rang là où un
   *     `ranking_scratch = 1` en dur ne compterait rien sur ces compétitions.
   *
   * Structure de la requête, calquée sur PalmaresService.getPalmares :
   *  1. `club_starts` : les départs (compétition, code course, catégorie) où le
   *     club a au moins un classé, restreints par les filtres du dashboard.
   *  2. `peers` : *toutes* les lignes de ces départs. Indispensable — un rang se
   *     calcule contre l'ensemble des partants, pas contre les seuls équipiers.
   *  3. `ranked` : ROW_NUMBER() partitionné par départ, NULL sur les lignes
   *     commentées (ABD, NC, DSQ…) qui ne prennent pas de rang.
   *  4. Agrégation des seules lignes du club, groupées par (licence, catégorie).
   *
   * Le comptage des challenges sprint exige un rang non nul, reprenant le
   * garde-fou de l'affichage mobile (l'éclair n'y est montré que sur un coureur
   * effectivement classé).
   *
   * @param club    libellé exact de `race.club` — le club porté le jour de la
   *                course, cohérent avec le filtre des autres graphes de l'écran
   * @param filters filtres du dashboard ; `clubs` est ignoré au profit de `club`
   */
  async getClubPerformances(
    club: string,
    clubFede: string,
    filters: DashboardChartFiltersDto,
  ): Promise<ClubPerformanceDto[]> {
    // Les placeholders sont numérotés à la volée via `params.length` : chaque
    // fragment porte son propre index, quel que soit son emplacement dans le SQL.
    const params: unknown[] = [club];
    const competitionConditions: string[] = [];
    const riderConditions: string[] = [];

    // Lève l'ambiguïté des libellés de club homonymes entre fédérations. Le
    // périmètre passe par l'organisateur de l'épreuve, l'identité par la licence
    // du coureur — un licencié UFOLEP peut courir une épreuve FSGT, mais ce
    // résultat appartient alors au club FSGT, pas au club UFOLEP homonyme.
    //
    // Les casts ::text sont obligatoires : `licence.fede` et `competition.fede`
    // sont deux enums PostgreSQL distincts.
    params.push(clubFede);
    const fedeParam = `$${params.length}`;
    competitionConditions.push(`AND c.fede::text = ${fedeParam}`);
    riderConditions.push(`AND l.fede::text = ${fedeParam}`);

    if (filters.startDate) {
      params.push(filters.startDate);
      competitionConditions.push(`AND DATE(c.event_date) >= $${params.length}`);
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      competitionConditions.push(`AND DATE(c.event_date) <= $${params.length}`);
    }
    // fede et competition_type sont des enums PostgreSQL : le cast ::text est
    // requis pour les comparer au tableau de chaînes envoyé par le client.
    if (filters.fedes?.length) {
      params.push(filters.fedes);
      competitionConditions.push(`AND c.fede::text = ANY($${params.length})`);
    }
    if (filters.competitionTypes?.length) {
      params.push(filters.competitionTypes);
      competitionConditions.push(`AND c.competition_type::text = ANY($${params.length})`);
    }
    if (filters.competitionDepts?.length) {
      params.push(filters.competitionDepts);
      competitionConditions.push(`AND c.dept = ANY($${params.length})`);
    }
    // riderDepts porte sur le coureur, pas sur l'épreuve : il restreint les
    // lignes retenues en fin de requête, sans réduire les départs analysés.
    if (filters.riderDepts?.length) {
      params.push(filters.riderDepts);
      riderConditions.push(`AND l.dept = ANY($${params.length})`);
    }

    const query = `
      WITH club_starts AS (
        SELECT DISTINCT r.competition_id, r.race_code, r.catev
        FROM race r
        JOIN competition c ON c.id = r.competition_id
        WHERE r.club = $1
          AND (r.ranking_scratch IS NOT NULL OR r.comment IS NOT NULL)
          ${competitionConditions.join('\n          ')}
      ),
      peers AS (
        SELECT r.competition_id, r.race_code, r.catev, r.licence_id, r.club,
               r.ranking_scratch, r.comment, r.sprintchallenge
        FROM race r
        JOIN club_starts cs
          ON r.competition_id = cs.competition_id
         AND r.race_code IS NOT DISTINCT FROM cs.race_code
         AND r.catev     IS NOT DISTINCT FROM cs.catev
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
          END AS rank_in_cat
        FROM peers p
      )
      SELECT
        l.id         AS "licenceId",
        l.name       AS "name",
        l.first_name AS "firstName",
        ranked.catev AS "catev",
        COUNT(*) FILTER (WHERE ranked.rank_in_cat = 1) AS "wins",
        COUNT(*) FILTER (WHERE ranked.rank_in_cat = 2) AS "seconds",
        COUNT(*) FILTER (WHERE ranked.rank_in_cat = 3) AS "thirds",
        COUNT(*) FILTER (
          WHERE ranked.sprintchallenge AND ranked.rank_in_cat IS NOT NULL
        ) AS "sprintChallenges"
      FROM ranked
      JOIN licence l ON l.id = ranked.licence_id
      WHERE ranked.club = $1
        ${riderConditions.join('\n        ')}
      GROUP BY l.id, l.name, l.first_name, ranked.catev
      HAVING COUNT(*) FILTER (WHERE ranked.rank_in_cat <= 3) > 0
          OR COUNT(*) FILTER (
               WHERE ranked.sprintchallenge AND ranked.rank_in_cat IS NOT NULL
             ) > 0
      ORDER BY "wins" DESC, "seconds" DESC, "thirds" DESC, l.name ASC
    `;

    const rows: Array<{
      licenceId: number;
      name: string;
      firstName: string;
      catev: string | null;
      wins: string;
      seconds: string;
      thirds: string;
      sprintChallenges: string;
    }> = await this.dataSource.query(query, params);

    // COUNT() renvoie un bigint, que le driver pg sérialise en chaîne.
    return rows.map(r => ({
      licenceId: r.licenceId,
      name: r.name,
      firstName: r.firstName,
      catev: r.catev,
      wins: Number(r.wins),
      seconds: Number(r.seconds),
      thirds: Number(r.thirds),
      sprintChallenges: Number(r.sprintChallenges),
    }));
  }

  // Existing methods below - keep them as-is

  async getStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
    const { startDate, endDate, federation } = filters;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Build query builders first (before Promise.all)
    const competitionQb = this.competitionRepository.createQueryBuilder('competition');
    if (startDate) {
      competitionQb.andWhere('competition.eventDate >= :startDate', { startDate });
    }
    if (endDate) {
      competitionQb.andWhere('competition.eventDate <= :endDate', { endDate });
    }
    if (federation) {
      competitionQb.andWhere('competition.fede = :federation', { federation });
    }

    // Clone upcomingQb BEFORE Promise.all since it depends on competitionQb
    const upcomingQb = competitionQb.clone();
    upcomingQb.andWhere('competition.eventDate >= :now', { now });

    const licenceQb = this.licenceRepository.createQueryBuilder('licence');
    if (federation) {
      licenceQb.where('licence.fede = :federation', { federation });
    }

    const clubQb = this.clubRepository.createQueryBuilder('club');
    if (federation) {
      clubQb.where('club.fede = :federation', { federation });
    }

    // Run all independent queries in parallel
    const [
      totalCompetitions,
      upcomingCompetitions,
      totalLicences,
      totalRaces,
      totalClubs,
      competitionsByFederation,
      competitionsByType,
      competitionsByMonth,
      licencesByFederation,
    ] = await Promise.all([
      competitionQb.getCount(),
      upcomingQb.getCount(),
      licenceQb.getCount(),
      this.raceRepository.count(),
      clubQb.getCount(),
      this.competitionRepository
        .createQueryBuilder('competition')
        .select('competition.fede', 'federation')
        .addSelect('COUNT(*)', 'count')
        .groupBy('competition.fede')
        .getRawMany(),
      this.competitionRepository
        .createQueryBuilder('competition')
        .select('competition.competitionType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('competition.competitionType')
        .getRawMany(),
      this.competitionRepository
        .createQueryBuilder('competition')
        .select("TO_CHAR(competition.eventDate, 'YYYY-MM')", 'month')
        .addSelect('COUNT(*)', 'count')
        .where('EXTRACT(YEAR FROM competition.eventDate) = :year', { year: currentYear })
        .groupBy("TO_CHAR(competition.eventDate, 'YYYY-MM')")
        .orderBy('month', 'ASC')
        .getRawMany(),
      this.licenceRepository
        .createQueryBuilder('licence')
        .select('licence.fede', 'federation')
        .addSelect('COUNT(*)', 'count')
        .groupBy('licence.fede')
        .getRawMany(),
    ]);

    const pastCompetitions = totalCompetitions - upcomingCompetitions;

    return {
      totalCompetitions,
      upcomingCompetitions,
      pastCompetitions,
      totalLicences,
      totalRaces,
      totalClubs,
      competitionsByFederation,
      competitionsByType,
      competitionsByMonth,
      licencesByFederation,
    };
  }

  async getRecentActivity(limit: number = 10): Promise<{
    recentCompetitions: CompetitionEntity[];
    recentRaces: RaceEntity[];
  }> {
    const recentCompetitions = await this.competitionRepository.find({
      order: { id: 'DESC' },
      take: limit,
      relations: ['club'],
    });

    const recentRaces = await this.raceRepository.find({
      order: { id: 'DESC' },
      take: limit,
      relations: ['competition', 'licence'],
    });

    return {
      recentCompetitions,
      recentRaces,
    };
  }

  async getSummary(): Promise<DashboardSummary> {
    const totalLicenses = await this.licenceRepository.count();
    const totalCompetitions = await this.competitionRepository.count();

    return {
      stats: {
        totalLicenses,
        totalCompetitions,
      },
    };
  }
}
