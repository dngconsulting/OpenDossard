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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChallengesService, CreateChallengeDto, UpdateChallengeDto } from './challenges.service';
import { ChallengeEntity } from './entities/challenge.entity';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Challenges')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get all challenges' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of challenges' })
  async findAll(@Query('active') active?: boolean): Promise<ChallengeEntity[]> {
    return this.challengesService.findAll(active);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get challenge by ID' })
  @ApiResponse({ status: 200, description: 'Challenge details' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ChallengeEntity> {
    return this.challengesService.findOne(id);
  }

  @Get(':id/ranking')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({ summary: 'Get challenge ranking' })
  @ApiResponse({ status: 200, description: 'Challenge ranking', type: [ChallengeRiderDto] })
  async getRanking(@Param('id', ParseIntPipe) id: number): Promise<ChallengeRiderDto[]> {
    return this.challengesService.getRanking(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Create a new challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  async create(@Body() challengeData: CreateChallengeDto): Promise<ChallengeEntity> {
    return this.challengesService.create(challengeData);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Update a challenge' })
  @ApiResponse({ status: 200, description: 'Challenge updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() challengeData: UpdateChallengeDto,
  ): Promise<ChallengeEntity> {
    return this.challengesService.update(id, challengeData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a challenge' })
  @ApiResponse({ status: 200, description: 'Challenge deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await this.challengesService.remove(id);
    return { success: true };
  }

  @Post(':id/competitions/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({ summary: 'Add a competition to a challenge' })
  @ApiResponse({ status: 200, description: 'Competition added to challenge' })
  async addCompetition(
    @Param('id', ParseIntPipe) id: number,
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<ChallengeEntity> {
    return this.challengesService.addCompetition(id, competitionId);
  }

  @Delete(':id/competitions/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a competition from a challenge' })
  @ApiResponse({ status: 200, description: 'Competition removed from challenge' })
  async removeCompetition(
    @Param('id', ParseIntPipe) id: number,
    @Param('competitionId', ParseIntPipe) competitionId: number,
  ): Promise<ChallengeEntity> {
    return this.challengesService.removeCompetition(id, competitionId);
  }
}
