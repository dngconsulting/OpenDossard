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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompetitionsService } from './competitions.service';
import { CompetitionIdsDto, FilterCompetitionDto, ReorganizeCompetitionDto } from './dto';
import { CompetitionEntity } from './entities/competition.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto';

@ApiTags('Competitions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all competitions with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of competitions' })
  async findAll(
    @Query() filterDto: FilterCompetitionDto,
  ): Promise<
    PaginatedResponseDto<CompetitionEntity & { engagementsCount: number; classementsCount: number }>
  > {
    return this.competitionsService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get competition by ID' })
  @ApiResponse({ status: 200, description: 'Competition details' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CompetitionEntity> {
    return this.competitionsService.findOne(id);
  }

  @Post('by-ids')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get competitions by a list of IDs (batch, ordered by date)' })
  @ApiResponse({ status: 200, description: 'Competitions matching the given IDs' })
  async findByIds(@Body() dto: CompetitionIdsDto): Promise<CompetitionEntity[]> {
    return this.competitionsService.findByIds(dto.ids);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create a new competition' })
  @ApiResponse({ status: 201, description: 'Competition created' })
  async create(
    @Body() competitionData: Partial<CompetitionEntity>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompetitionEntity> {
    return this.competitionsService.create(competitionData, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a competition' })
  @ApiResponse({ status: 200, description: 'Competition updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() competitionData: Partial<CompetitionEntity>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompetitionEntity> {
    return this.competitionsService.update(id, competitionData, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a competition' })
  @ApiResponse({ status: 200, description: 'Competition deleted' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.competitionsService.remove(id, user);
    return { success: true };
  }

  @Post(':id/duplicate')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Duplicate a competition' })
  @ApiResponse({ status: 201, description: 'Competition duplicated' })
  async duplicate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompetitionEntity> {
    return this.competitionsService.duplicate(id, user);
  }

  @Post(':id/validate')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Validate competition results' })
  @ApiResponse({ status: 200, description: 'Results validated' })
  async validate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompetitionEntity> {
    return this.competitionsService.validate(id, user);
  }

  @Post('reorganize')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorganize competition races' })
  @ApiResponse({ status: 200, description: 'Races reorganized' })
  async reorganize(
    @Body() dto: ReorganizeCompetitionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.competitionsService.reorganize(dto, user);
    return { success: true };
  }
}
