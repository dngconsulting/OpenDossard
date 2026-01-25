import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { RaceEntity } from '../races/entities/race.entity';
import { ClubEntity } from '../clubs/entities/club.entity';

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

  async getStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
    const { startDate, endDate, federation } = filters;
    const now = new Date();

    // Build competition query builder with filters
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

    // Upcoming competitions
    const upcomingQb = competitionQb.clone();
    upcomingQb.andWhere('competition.eventDate >= :now', { now });
    const upcomingCompetitions = await upcomingQb.getCount();

    // Past competitions
    const pastCompetitions = totalCompetitions - upcomingCompetitions;

    // Licences count
    const licenceQb = this.licenceRepository.createQueryBuilder('licence');
    if (federation) {
      licenceQb.where('licence.fede = :federation', { federation });
    }
    const totalLicences = await licenceQb.getCount();

    // Races count
    const totalRaces = await this.raceRepository.count();

    // Clubs count
    const clubQb = this.clubRepository.createQueryBuilder('club');
    if (federation) {
      clubQb.where('club.fede = :federation', { federation });
    }
    const totalClubs = await clubQb.getCount();

    // Competitions by federation
    const competitionsByFederation = await this.competitionRepository
      .createQueryBuilder('competition')
      .select('competition.fede', 'federation')
      .addSelect('COUNT(*)', 'count')
      .groupBy('competition.fede')
      .getRawMany();

    // Competitions by type
    const competitionsByType = await this.competitionRepository
      .createQueryBuilder('competition')
      .select('competition.competitionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('competition.competitionType')
      .getRawMany();

    // Competitions by month (for current year)
    const currentYear = now.getFullYear();
    const competitionsByMonth = await this.competitionRepository
      .createQueryBuilder('competition')
      .select("TO_CHAR(competition.eventDate, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM competition.eventDate) = :year', { year: currentYear })
      .groupBy("TO_CHAR(competition.eventDate, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Licences by federation
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
