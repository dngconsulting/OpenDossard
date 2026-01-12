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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RacesService, RaceFilterDto, CreateRaceDto, UpdateRaceDto } from './races.service';
import { RaceEntity } from './entities/race.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto';

@ApiTags('Races')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all races with filters' })
  @ApiQuery({ name: 'competitionId', required: false, type: Number })
  @ApiQuery({ name: 'licenceId', required: false, type: Number })
  @ApiQuery({ name: 'raceCode', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of races' })
  async findAll(@Query() filterDto: RaceFilterDto): Promise<PaginatedResponseDto<RaceEntity>> {
    return this.racesService.findAll(filterDto);
  }

  @Get('competition/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all races for a competition' })
  @ApiResponse({ status: 200, description: 'List of races for the competition' })
  async findByCompetition(
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<RaceEntity[]> {
    return this.racesService.findByCompetition(competitionId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get race by ID' })
  @ApiResponse({ status: 200, description: 'Race details' })
  @ApiResponse({ status: 404, description: 'Race not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RaceEntity> {
    return this.racesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create a new race entry' })
  @ApiResponse({ status: 201, description: 'Race created' })
  async create(@Body() raceData: CreateRaceDto): Promise<RaceEntity> {
    return this.racesService.create(raceData);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create multiple race entries' })
  @ApiResponse({ status: 201, description: 'Races created' })
  async createMany(@Body() racesData: CreateRaceDto[]): Promise<RaceEntity[]> {
    return this.racesService.createMany(racesData);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a race entry' })
  @ApiResponse({ status: 200, description: 'Race updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() raceData: UpdateRaceDto,
  ): Promise<RaceEntity> {
    return this.racesService.update(id, raceData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a race entry' })
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

  @Post('competition/:competitionId/results')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update race results for a competition' })
  @ApiResponse({ status: 200, description: 'Results updated' })
  async updateResults(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Body() results: { licenceId: number; raceCode: string; rankingScratch: number; chrono?: string; tours?: string }[],
  ): Promise<RaceEntity[]> {
    return this.racesService.updateResults(competitionId, results);
  }
}
