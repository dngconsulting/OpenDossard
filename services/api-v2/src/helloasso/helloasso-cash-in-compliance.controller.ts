import { Controller, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthorizationService } from '../auth/authorization.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role } from '../common/enums';
import { HelloAssoCashInComplianceService } from './helloasso-cash-in-compliance.service';
import { type HelloAssoLinkStatus } from './helloasso-details.service';

/**
 * Rafraîchissement manuel du drapeau de conformité encaissement d'un club.
 *
 *   POST /api-v2/helloasso/clubs/:id/cash-in-compliance/refresh  [JWT, ADMIN|ORGANISATEUR]
 *
 * Contrôleur séparé de `HelloAssoController` (même préfixe) pour garder chaque
 * fichier sous la taille maximale du projet.
 */
@ApiTags('helloasso')
@Controller('helloasso')
export class HelloAssoCashInComplianceController {
  constructor(
    private readonly compliance: HelloAssoCashInComplianceService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post('clubs/:clubId/cash-in-compliance/refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Relire chez HelloAsso la conformité encaissement du club',
    description: `Relit \`isCashInCompliant\` avec le jeton du club (HelloAsso ne renvoie ce
drapeau qu'à un administrateur de l'organisation), l'enregistre — \`true\` comme \`false\` —
et renvoie le statut de liaison à jour (même DTO que \`GET clubs/:clubId/status\`).

Le jeton d'accès stocké est réutilisé tant qu'il est valide ; sinon il est renouvelé et
les nouveaux jetons sont réenregistrés, comme le fait le cron de refresh.

- 404 : club non lié à HelloAsso.
- 409 : HelloAsso refuse le jeton du club — la liaison doit être refaite via la mire.
- 502 : HelloAsso injoignable ou réponse sans drapeau ; la base n'est pas modifiée.`,
  })
  async refresh(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<HelloAssoLinkStatus> {
    await this.authorizationService.assertClubAccess(user, clubId);
    return this.compliance.refresh(clubId);
  }
}
