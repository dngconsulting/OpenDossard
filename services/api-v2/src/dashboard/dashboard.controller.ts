import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService, DashboardStats, DashboardFilters, DashboardSummary } from './dashboard.service';
import { DashboardChartFiltersDto } from './dto/dashboard-chart-filters.dto';
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
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
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
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get riders count per competition' })
  @ApiResponse({ status: 200, description: 'Riders per competition chart data' })
  async getRidersPerCompetition(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ name: string; eventDate: string; count: number }[]> {
    return this.dashboardService.getRidersPerCompetition(filters);
  }

  @Get('charts/club-participation')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get club participation stats' })
  @ApiResponse({ status: 200, description: 'Club participation chart data' })
  async getClubParticipation(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ club: string; count: number }[]> {
    return this.dashboardService.getClubParticipation(filters);
  }

  @Get('charts/catea-distribution')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get age category distribution' })
  @ApiResponse({ status: 200, description: 'Age category distribution chart data' })
  async getCateaDistribution(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ catea: string; count: number }[]> {
    return this.dashboardService.getCateaDistribution(filters);
  }

  @Get('charts/catev-distribution')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get value category distribution' })
  @ApiResponse({ status: 200, description: 'Value category distribution chart data' })
  async getCatevDistribution(
    @Query() filters: DashboardChartFiltersDto,
  ): Promise<{ catev: string; count: number }[]> {
    return this.dashboardService.getCatevDistribution(filters);
  }

  @Get('charts/top-riders')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Get top 50 most active riders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top riders chart data' })
  async getTopRiders(
    @Query() filters: DashboardChartFiltersDto,
    @Query('limit') limit?: number,
  ): Promise<{ name: string; firstName: string; club: string; count: number }[]> {
    return this.dashboardService.getTopRiders(filters, limit || 50);
  }
}
