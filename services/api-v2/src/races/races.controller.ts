import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RacesService } from './races.service';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto';
import {
  CreateEngagementDto,
  FilterRaceDto,
  RaceRowDto,
  PalmaresRowDto,
  UpdateRankingDto,
  RemoveRankingDto,
  UpdateChronoDto,
  UpdateToursDto,
  ReorderRankingItemDto,
} from './dto';

@ApiTags('Races')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  // ==================== QUERIES ====================

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all races with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of races' })
  async findAll(
    @Query() filterDto: FilterRaceDto,
  ): Promise<PaginatedResponseDto<RaceEntity>> {
    return this.racesService.findAll(filterDto);
  }

  @Get('competition/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Get all race entries for a competition with rider info',
    operationId: 'getCompetitionRaces',
  })
  @ApiParam({ name: 'competitionId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of races with rider information',
    type: [RaceRowDto],
  })
  async findByCompetition(
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<RaceRowDto[]> {
    return this.racesService.findByCompetition(competitionId);
  }

  @Get('palmares/:licenceId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Get palmares (race history) for a rider',
    operationId: 'getPalmares',
  })
  @ApiParam({ name: 'licenceId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of past races with rankings',
    type: [PalmaresRowDto],
  })
  async getPalmares(
    @Param('licenceId', ParseIntPipe) licenceId: number,
  ): Promise<PalmaresRowDto[]> {
    return this.racesService.getPalmares(licenceId);
  }

  @Get('withpalmares/:query')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Search licences that have at least one race in their palmares',
    operationId: 'getLicencesWithPalmares',
  })
  @ApiParam({ name: 'query', type: String, description: 'Search query (name)' })
  @ApiResponse({
    status: 200,
    description: 'List of licences with palmares',
    type: [LicenceEntity],
  })
  async getLicencesWithPalmares(
    @Param('query') query: string,
  ): Promise<LicenceEntity[]> {
    return this.racesService.getLicencesWithPalmares(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get race entry by ID' })
  @ApiResponse({ status: 200, description: 'Race details', type: RaceEntity })
  @ApiResponse({ status: 404, description: 'Race not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RaceEntity> {
    return this.racesService.findOne(id);
  }

  // ==================== ENGAGEMENTS ====================

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Engage a rider in a competition',
    operationId: 'engage',
  })
  @ApiBody({ type: CreateEngagementDto })
  @ApiResponse({ status: 201, description: 'Rider engaged', type: RaceEntity })
  @ApiResponse({
    status: 400,
    description: 'Validation error (rider number taken, already registered)',
  })
  async engage(@Body() dto: CreateEngagementDto): Promise<RaceEntity> {
    return this.racesService.engage(dto);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create multiple race entries at once' })
  @ApiResponse({ status: 201, description: 'Races created' })
  async createMany(
    @Body() racesData: Partial<RaceEntity>[],
  ): Promise<RaceEntity[]> {
    return this.racesService.createMany(racesData);
  }

  @Post('refresh/:licenceId/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Refresh engagement data from licence info',
    operationId: 'refreshEngagement',
  })
  @ApiParam({ name: 'licenceId', type: Number })
  @ApiParam({ name: 'competitionId', type: Number })
  @ApiResponse({ status: 200, description: 'Engagement refreshed' })
  async refreshEngagement(
    @Param('licenceId', ParseIntPipe) licenceId: number,
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<RaceEntity> {
    return this.racesService.refreshEngagement(licenceId, competitionId);
  }

  // ==================== RANKINGS ====================

  @Put('ranking')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Update rider ranking (classify a rider)',
    operationId: 'updateRanking',
  })
  @ApiBody({ type: UpdateRankingDto })
  @ApiResponse({ status: 200, description: 'Ranking updated', type: RaceEntity })
  async updateRanking(@Body() dto: UpdateRankingDto): Promise<RaceEntity> {
    return this.racesService.updateRanking(dto);
  }

  @Put('ranking/remove')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove rider from ranking and reorder others',
    operationId: 'removeRanking',
  })
  @ApiBody({ type: RemoveRankingDto })
  @ApiResponse({ status: 200, description: 'Ranking removed' })
  async removeRanking(@Body() dto: RemoveRankingDto): Promise<{ success: boolean }> {
    await this.racesService.removeRanking(dto);
    return { success: true };
  }

  @Put('ranking/reorder')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorder rankings manually',
    operationId: 'reorderRanking',
  })
  @ApiBody({ type: [ReorderRankingItemDto] })
  @ApiResponse({ status: 200, description: 'Rankings reordered' })
  async reorderRankings(
    @Body() items: ReorderRankingItemDto[],
  ): Promise<{ success: boolean }> {
    await this.racesService.reorderRankings(items);
    return { success: true };
  }

  // ==================== CHALLENGE & CHRONO ====================

  @Put(':id/challenge')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Toggle sprint challenge flag',
    operationId: 'flagChallenge',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Challenge flag toggled' })
  async toggleSprintChallenge(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RaceEntity> {
    return this.racesService.toggleSprintChallenge(id);
  }

  @Patch(':id/chrono')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Update rider chrono time',
    operationId: 'updateChrono',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateChronoDto })
  @ApiResponse({ status: 200, description: 'Chrono updated' })
  async updateChrono(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChronoDto,
  ): Promise<RaceEntity> {
    return this.racesService.updateChrono(id, dto.chrono);
  }

  @Patch(':id/tours')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Update rider lap count',
    operationId: 'updateTours',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateToursDto })
  @ApiResponse({ status: 200, description: 'Tours updated' })
  async updateTours(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateToursDto,
  ): Promise<RaceEntity> {
    return this.racesService.updateTours(id, dto.tours ?? null);
  }

  // ==================== GENERIC UPDATE ====================

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a race entry (generic)' })
  @ApiResponse({ status: 200, description: 'Race updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() raceData: Partial<RaceEntity>,
  ): Promise<RaceEntity> {
    return this.racesService.update(id, raceData);
  }

  // ==================== UPLOAD CSV ====================

  @UseInterceptors(FileInterceptor('file'))
  @Post('results/upload/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Upload race results from CSV file',
    operationId: 'uploadResultsCsv',
  })
  @ApiParam({ name: 'competitionId', type: Number })
  @ApiResponse({ status: 201, description: 'Results uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format or data' })
  async uploadResultsCsv(
    @UploadedFile() file: Express.Multer.File,
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<{ processed: number; errors: string[] }> {
    return this.racesService.uploadResultsCsv(competitionId, file);
  }

  // ==================== RESULTS ====================

  @Post('competition/:competitionId/results')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update race results in bulk for a competition' })
  @ApiResponse({ status: 200, description: 'Results updated' })
  async updateResults(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Body()
    results: {
      licenceId: number;
      raceCode: string;
      rankingScratch: number;
      chrono?: string;
      tours?: number;
    }[],
  ): Promise<RaceEntity[]> {
    return this.racesService.updateResults(competitionId, results);
  }

  // ==================== DELETE ====================

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a race entry (disengage rider)',
    operationId: 'deleteRace',
  })
  @ApiResponse({ status: 200, description: 'Race deleted' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    await this.racesService.remove(id);
    return { success: true };
  }

  @Delete('competition/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all races for a competition' })
  @ApiResponse({ status: 200, description: 'Races deleted' })
  async removeByCompetition(
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<{ success: boolean }> {
    await this.racesService.removeByCompetition(competitionId);
    return { success: true };
  }
}
