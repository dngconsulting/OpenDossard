import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { ClubEntity } from '../clubs/entities/club.entity';
import { DashboardChartFiltersDto } from './dto/dashboard-chart-filters.dto';

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
      qb.andWhere('competition.competitionType IN (:...competitionTypes)', { competitionTypes: filters.competitionTypes });
    }
    if (filters.competitionDepts?.length) {
      qb.andWhere('competition.dept IN (:...competitionDepts)', { competitionDepts: filters.competitionDepts });
    }
    if (filters.riderDepts?.length) {
      qb.andWhere('licence.dept IN (:...riderDepts)', { riderDepts: filters.riderDepts });
    }
    if (filters.clubs?.length) {
      qb.andWhere('race.club IN (:...clubs)', { clubs: filters.clubs });
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

  async getRidersPerCompetition(filters: DashboardChartFiltersDto): Promise<{ name: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select('competition.name', 'name')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('competition.id')
      .addGroupBy('competition.name')
      .orderBy('count', 'DESC')
      .limit(100)
      .getRawMany();

    return results.map(r => ({ name: r.name, count: parseInt(r.count, 10) }));
  }

  async getClubParticipation(filters: DashboardChartFiltersDto): Promise<{ club: string; count: number }[]> {
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

  async getCateaDistribution(filters: DashboardChartFiltersDto): Promise<{ catea: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select("COALESCE(NULLIF(race.catea, ''), 'Non défini')", 'catea')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('race.catea')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map(r => ({ catea: r.catea, count: parseInt(r.count, 10) }));
  }

  async getCatevDistribution(filters: DashboardChartFiltersDto): Promise<{ catev: string; count: number }[]> {
    const qb = this.createBaseChartQuery(filters);
    const results = await qb
      .select("COALESCE(NULLIF(race.catev, ''), 'Non défini')", 'catev')
      .addSelect('COUNT(race.id)', 'count')
      .groupBy('race.catev')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map(r => ({ catev: r.catev, count: parseInt(r.count, 10) }));
  }

  async getTopRiders(filters: DashboardChartFiltersDto, limit: number = 50): Promise<{ name: string; firstName: string; club: string; count: number }[]> {
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

    return results.map(r => ({ name: r.name, firstName: r.firstName, club: r.club, count: parseInt(r.count, 10) }));
  }

  // Existing methods below - keep them as-is

  async getStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
    const { startDate, endDate, federation } = filters;
    const now = new Date();

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

    const totalCompetitions = await competitionQb.getCount();

    const upcomingQb = competitionQb.clone();
    upcomingQb.andWhere('competition.eventDate >= :now', { now });
    const upcomingCompetitions = await upcomingQb.getCount();

    const pastCompetitions = totalCompetitions - upcomingCompetitions;

    const licenceQb = this.licenceRepository.createQueryBuilder('licence');
    if (federation) {
      licenceQb.where('licence.fede = :federation', { federation });
    }
    const totalLicences = await licenceQb.getCount();

    const totalRaces = await this.raceRepository.count();

    const clubQb = this.clubRepository.createQueryBuilder('club');
    if (federation) {
      clubQb.where('club.fede = :federation', { federation });
    }
    const totalClubs = await clubQb.getCount();

    const competitionsByFederation = await this.competitionRepository
      .createQueryBuilder('competition')
      .select('competition.fede', 'federation')
      .addSelect('COUNT(*)', 'count')
      .groupBy('competition.fede')
      .getRawMany();

    const competitionsByType = await this.competitionRepository
      .createQueryBuilder('competition')
      .select('competition.competitionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('competition.competitionType')
      .getRawMany();

    const currentYear = now.getFullYear();
    const competitionsByMonth = await this.competitionRepository
      .createQueryBuilder('competition')
      .select("TO_CHAR(competition.eventDate, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM competition.eventDate) = :year', { year: currentYear })
      .groupBy("TO_CHAR(competition.eventDate, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const licencesByFederation = await this.licenceRepository
      .createQueryBuilder('licence')
      .select('licence.fede', 'federation')
      .addSelect('COUNT(*)', 'count')
      .groupBy('licence.fede')
      .getRawMany();

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
