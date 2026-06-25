import {
  Controller,
  Get,
  Post,
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
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { RacesService } from './races.service';
import { PalmaresService } from './palmares.service';
import { ResultsCsvService } from './results-csv.service';
import { RaceImportService } from './race-import.service';
import { RaceEntity } from './entities/race.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto';
import {
  CreateEngagementDto,
  FilterRaceDto,
  RaceRowDto,
  PalmaresResponseDto,
  BulkDeleteRacesDto,
  ImportEngagesResultDto,
} from './dto';

@ApiTags('Races')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('races')
export class RacesController {
  constructor(
    private readonly racesService: RacesService,
    private readonly palmaresService: PalmaresService,
    private readonly resultsCsvService: ResultsCsvService,
    private readonly raceImportService: RaceImportService,
  ) {}

  // ==================== QUERIES ====================

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all races with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of races' })
  async findAll(@Query() filterDto: FilterRaceDto): Promise<PaginatedResponseDto<RaceEntity>> {
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
    description: 'Palmares with licence info, stats, category history and results',
    type: PalmaresResponseDto,
  })
  async getPalmares(
    @Param('licenceId', ParseIntPipe) licenceId: number,
  ): Promise<PalmaresResponseDto> {
    return this.palmaresService.getPalmares(licenceId);
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
  async getLicencesWithPalmares(@Param('query') query: string): Promise<LicenceEntity[]> {
    return this.palmaresService.getLicencesWithPalmares(query);
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
  async engage(
    @Body() dto: CreateEngagementDto,
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.racesService.engage(dto, author);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create multiple race entries at once' })
  @ApiResponse({ status: 201, description: 'Races created' })
  async createMany(
    @Body() racesData: Partial<RaceEntity>[],
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity[]> {
    return this.racesService.createMany(racesData, author);
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
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.racesService.refreshEngagement(licenceId, competitionId, author);
  }

  // Classement, challenge, chrono, tours → voir RaceResultsController.

  // ==================== GENERIC UPDATE ====================

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a race entry (generic)' })
  @ApiResponse({ status: 200, description: 'Race updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() raceData: Partial<RaceEntity>,
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.racesService.update(id, raceData, author);
  }

  // ==================== UPLOAD CSV ====================

  @UseInterceptors(FileInterceptor('file'))
  @Post('import/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Import engagés from CSV file (mirror of export Engagés)',
    operationId: 'importEngagesCsv',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'competitionId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Import result', type: ImportEngagesResultDto })
  async importEngagesCsv(
    @UploadedFile() file: Express.Multer.File,
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @CurrentUser('email') author: string,
  ): Promise<ImportEngagesResultDto> {
    const content = file.buffer.toString('utf-8');
    return this.raceImportService.importFromCsv(competitionId, content, author);
  }

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
    @CurrentUser('email') author: string,
  ): Promise<{ processed: number; errors: string[] }> {
    return this.resultsCsvService.uploadResultsCsv(competitionId, file, author);
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
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity[]> {
    return this.racesService.updateResults(competitionId, results, author);
  }

  // ==================== DELETE ====================

  @Post('bulk-delete')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disengage multiple riders atomically (single DELETE)',
    operationId: 'deleteRacesBulk',
  })
  @ApiBody({ type: BulkDeleteRacesDto })
  @ApiResponse({ status: 200, description: 'Riders disengaged' })
  async removeMany(@Body() dto: BulkDeleteRacesDto): Promise<{ success: boolean; count: number }> {
    const count = await this.racesService.removeMany(dto.ids, dto.competitionId);
    return { success: true, count };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a race entry (disengage rider)',
    operationId: 'deleteRace',
  })
  @ApiResponse({ status: 200, description: 'Race deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
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
