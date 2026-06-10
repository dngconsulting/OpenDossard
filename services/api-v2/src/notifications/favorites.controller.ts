import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums';
import { FavoriteCompetitionDto } from './dto/favorite-competition.dto';
import { StarCompetitionDto } from './dto/star-competition.dto';
import { FavoritesService } from './favorites.service';

/**
 * Épreuves starrées (favoris) du user mobile courant.
 *
 *   GET    /api-v2/favorites                  [JWT MOBILE] → number[] des competitionId starrés
 *   GET    /api-v2/favorites/competitions      [JWT MOBILE] → épreuves détaillées (Mon compte)
 *   POST   /api-v2/favorites { competitionId } [JWT MOBILE] → star (idempotent)
 *   DELETE /api-v2/favorites/:competitionId    [JWT MOBILE] → unstar (idempotent)
 *
 * Le GET est la source de vérité de l'état des étoiles côté app (resync au
 * login / nouveau device). L'identité vient TOUJOURS de `@CurrentUser('id')`
 * (JWT validé), jamais du body — un user ne star que pour lui-même.
 */
@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MOBILE)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste les ids des compétitions starrées du user courant' })
  @ApiResponse({ status: 200, description: 'Ids des compétitions starrées', type: [Number] })
  getFavorites(@CurrentUser('id') userId: number): Promise<number[]> {
    return this.favorites.findCompetitionIds(userId);
  }

  @Get('competitions')
  @ApiOperation({
    summary: 'Liste détaillée des épreuves starrées du user courant (nom, date, fédé)',
  })
  @ApiResponse({
    status: 200,
    description: 'Épreuves starrées, la plus récente d’abord',
    type: [FavoriteCompetitionDto],
  })
  getFavoriteCompetitions(@CurrentUser('id') userId: number): Promise<FavoriteCompetitionDto[]> {
    return this.favorites.findFavoriteCompetitions(userId);
  }

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Star une compétition (idempotent)' })
  @ApiResponse({ status: 204, description: 'Compétition starrée' })
  @ApiResponse({ status: 404, description: 'Compétition introuvable' })
  star(@Body() dto: StarCompetitionDto, @CurrentUser('id') userId: number): Promise<void> {
    return this.favorites.star(userId, dto.competitionId);
  }

  @Delete(':competitionId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Unstar une compétition (idempotent)' })
  @ApiResponse({ status: 204, description: 'Compétition retirée des favoris' })
  unstar(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @CurrentUser('id') userId: number,
  ): Promise<void> {
    return this.favorites.unstar(userId, competitionId);
  }
}
