import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService, DashboardStats, DashboardFilters } from './dashboard.service';
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
}
