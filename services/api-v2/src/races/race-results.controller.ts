import {
  Controller,
  Put,
  Patch,
  Body,
  Param,
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
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { RacesService } from './races.service';
import { RankingService } from './ranking.service';
import { RaceEntity } from './entities/race.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums';
import {
  UpdateRankingDto,
  RemoveRankingDto,
  BulkRemoveRankingDto,
  ReorderRankingItemDto,
  UpdateChronoDto,
  UpdateToursDto,
} from './dto';

/**
 * Endpoints de saisie des résultats d'une course : classement (créer / retirer /
 * retirer en masse / réordonner), challenge sprint, chrono et tours. Partage le
 * préfixe `races` avec `RacesController` (extrait pour garder chaque contrôleur
 * sous une taille raisonnable) ; les routes sont inchangées.
 */
@ApiTags('Races')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('races')
export class RaceResultsController {
  constructor(
    private readonly racesService: RacesService,
    private readonly rankingService: RankingService,
  ) {}

  // ==================== RANKINGS ====================

  @Put('ranking')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Update rider ranking (classify a rider)',
    operationId: 'updateRanking',
  })
  @ApiBody({ type: UpdateRankingDto })
  @ApiResponse({ status: 200, description: 'Ranking updated', type: RaceEntity })
  async updateRanking(
    @Body() dto: UpdateRankingDto,
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.rankingService.updateRanking(dto, author);
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
  async removeRanking(
    @Body() dto: RemoveRankingDto,
    @CurrentUser('email') author: string,
  ): Promise<{ success: boolean }> {
    await this.rankingService.removeRanking(dto, author);
    return { success: true };
  }

  @Put('ranking/remove-bulk')
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove multiple riders from ranking atomically (transactional)',
    operationId: 'removeRankingBulk',
  })
  @ApiBody({ type: BulkRemoveRankingDto })
  @ApiResponse({ status: 200, description: 'Riders removed from ranking' })
  async removeRankingBulk(
    @Body() dto: BulkRemoveRankingDto,
    @CurrentUser('email') author: string,
  ): Promise<{ success: boolean; count: number }> {
    const count = await this.rankingService.removeRankings(
      dto.ids,
      dto.raceCode,
      dto.competitionId,
      author,
    );
    return { success: true, count };
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
    @CurrentUser('email') author: string,
  ): Promise<{ success: boolean }> {
    await this.rankingService.reorderRankings(items, author);
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
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.racesService.toggleSprintChallenge(id, author);
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
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.racesService.updateChrono(id, dto.chrono, author);
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
    @CurrentUser('email') author: string,
  ): Promise<RaceEntity> {
    return this.racesService.updateTours(id, dto.tours ?? null, author);
  }
}
