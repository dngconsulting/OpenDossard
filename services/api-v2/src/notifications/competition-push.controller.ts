import { Body, Controller, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role } from '../common/enums';
import { CompetitionPushService } from './competition-push.service';
import { CompetitionPushResultDto } from './dto/competition-push-result.dto';
import { SendCompetitionPushDto } from './dto/send-competition-push.dto';

/**
 * Push organisateur vers les starreurs d'une épreuve.
 *
 *   POST /api-v2/competitions/:competitionId/push { message } [JWT ADMIN|ORGANISATEUR]
 *
 * Le scope club (un ORGANISATEUR ne notifie que les épreuves de ses clubs)
 * est vérifié dans le service via `AuthorizationService.assertCompetitionAccess`.
 */
@ApiTags('Competitions')
@ApiBearerAuth()
@Controller('competitions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ORGANISATEUR)
export class CompetitionPushController {
  constructor(private readonly push: CompetitionPushService) {}

  @Post(':competitionId/push')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Envoie un push aux users ayant starré l’épreuve (titre = nom de l’épreuve)',
  })
  @ApiResponse({ status: 200, description: 'Stats d’envoi', type: CompetitionPushResultDto })
  @ApiResponse({ status: 403, description: 'Épreuve hors du scope club de l’organisateur' })
  @ApiResponse({ status: 404, description: 'Compétition introuvable' })
  pushToStarrers(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Body() dto: SendCompetitionPushDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompetitionPushResultDto> {
    return this.push.pushToStarrers(user, competitionId, dto.message);
  }
}
