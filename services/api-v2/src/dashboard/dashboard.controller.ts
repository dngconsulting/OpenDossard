import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  DashboardService,
  DashboardStats,
  DashboardFilters,
  DashboardSummary,
} from './dashboard.service';
import { DashboardChartFiltersDto } from './dto/dashboard-chart-filters.dto';
import { ClubPerformanceDto } from './dto/club-performance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { RaceEntity } from '../races/entities/race.entity';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary with stats' })
  async getSummary(): Promise<DashboardSummary> {
    return this.dashboardService.getSummary();
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'federation', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getStats(@Query() filters: DashboardFilters): Promise<DashboardStats> {
    return this.dashboardService.getStats(filters);
  }

  @Get('recent')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent competitions and races' })
  async getRecentActivity(
    @Query('limit') limit?: number,
  ): Promise<{ recentCompetitions: CompetitionEntity[]; recentRaces: RaceEntity[] }> {
    return this.dashboardService.getRecentActivity(limit || 10);
  }

  @Get('charts/riders-per-competition')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get riders count per competition' })
  @ApiResponse({ status: 200, description: 'Riders per competition chart data' })
  async getRidersPerCompetition(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ name: string; eventDate: string; count: number }[]> {
    return this.dashboardService.getRidersPerCompetition(filters);
  }

  @Get('charts/club-participation')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get club participation stats' })
  @ApiResponse({ status: 200, description: 'Club participation chart data' })
  async getClubParticipation(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ club: string; count: number }[]> {
    return this.dashboardService.getClubParticipation(filters);
  }

  @Get('charts/catea-distribution')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get age category distribution' })
  @ApiResponse({ status: 200, description: 'Age category distribution chart data' })
  async getCateaDistribution(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ catea: string; count: number }[]> {
    return this.dashboardService.getCateaDistribution(filters);
  }

  @Get('charts/catev-distribution')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get value category distribution' })
  @ApiResponse({ status: 200, description: 'Value category distribution chart data' })
  async getCatevDistribution(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ catev: string; count: number }[]> {
    return this.dashboardService.getCatevDistribution(filters);
  }

  @Get('charts/top-riders')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get top 50 most active riders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top riders chart data' })
  async getTopRiders(
    @Query() filters: DashboardChartFiltersDto,
    @Query('limit') limit?: number,
  ): Promise<{ name: string; firstName: string; club: string; count: number }[]> {
    // Borne le limit côté contrôleur : la route est ouverte au rôle MOBILE,
    // un token mobile ne doit pas pouvoir aspirer tout l'effectif licencié.
    // Number(limit) || 50 couvre aussi ?limit=abc (NaN après transformation) → 50.
    return this.dashboardService.getTopRiders(filters, Math.min(Number(limit) || 50, 200));
  }

  @Get('charts/club-performances')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Get podium and sprint challenge counts for a single club',
    operationId: 'getClubPerformances',
  })
  @ApiResponse({
    status: 200,
    description: 'Per-rider, per-category podium counts for the requested club',
    type: [ClubPerformanceDto],
  })
  @ApiResponse({ status: 400, description: 'Exactly one club must be requested' })
  async getClubPerformances(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<ClubPerformanceDto[]> {
    // Un seul club exigé, et pas seulement pour la lisibilité de l'encart : la
    // route est ouverte au rôle MOBILE et la requête recalcule les rangs de tous
    // les partants des départs retenus. Sans club, elle balaierait toute la
    // table `race` — même réflexe que le clamp de `limit` sur top-riders.
    const clubs = filters.clubs ?? [];
    if (clubs.length !== 1) {
      throw new BadRequestException('Le filtre « clubs » doit contenir exactement un club.');
    }
    // `clubFede` est exigé, pas optionnel : sans elle un libellé homonyme
    // (« CAHORS CYCLISME » existe en UFOLEP, FFC et FFVELO) agrégerait les
    // résultats de plusieurs clubs distincts. Mieux vaut refuser la requête que
    // répondre des chiffres qui mélangent trois clubs.
    if (!filters.clubFede) {
      throw new BadRequestException(
        'Le filtre « clubFede » est requis : un nom de club ne suffit pas à le désigner.',
      );
    }
    return this.dashboardService.getClubPerformances(clubs[0], filters.clubFede, filters);
  }
}
