import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { ClubsService } from '../clubs/clubs.service';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService, HelloAssoLinkStatus } from './helloasso-details.service';
import { HelloAssoOAuthService, PreparedAuthorization } from './helloasso-oauth.service';

/**
 * Controller HelloAsso — orchestration de la mire d'autorisation.
 *
 *   POST   /api-v2/helloasso/oauth/authorize    [JWT, ADMIN|ORGANISATEUR] → { authorizeUrl }
 *   GET    /api-v2/helloasso/oauth/callback     [PUBLIC]                   → 302 vers la SPA
 *   GET    /api-v2/helloasso/clubs/:id/status   [JWT, ADMIN|ORGANISATEUR] → { linked, ... }
 *   DELETE /api-v2/helloasso/clubs/:id          [JWT, ADMIN|ORGANISATEUR] → 204
 *
 * **Pourquoi le callback est PUBLIC** : HelloAsso redirige le navigateur du user
 * vers cet endpoint avec `?code=...&state=...`. Aucun moyen pour HelloAsso de
 * transmettre un JWT dans ce redirect → endpoint obligatoirement public par
 * design OAuth2. La sécurité repose sur le `state` : random 256-bit, single-use,
 * TTL court, émis uniquement par `authorize` (lui-même role-guarded). Le state
 * est inforgeable et non-rejouable. Cf. `helloasso-oauth.service.ts` pour le
 * détail du modèle.
 */
@ApiTags('helloasso')
@Controller('helloasso')
export class HelloAssoController {
  private readonly logger = new Logger(HelloAssoController.name);

  constructor(
    private readonly oauth: HelloAssoOAuthService,
    private readonly details: HelloAssoDetailsService,
    private readonly clubs: ClubsService,
    private readonly config: HelloAssoConfig,
  ) {}

  @Post('oauth/authorize')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initier la liaison HelloAsso pour le user courant',
    description: `Génère un state OAuth (random 256-bit, single-use, TTL 10 min)
lié à l'identité du user appelant, et retourne l'URL de la mire HelloAsso
à ouvrir côté SPA (popup ou full-page). Réservé aux admins / organisateurs :
le callback finit par UPSERT silencieux la liaison du club matché par slug,
écrasant une éventuelle liaison existante — pas un droit ouvert aux coureurs.`,
  })
  authorize(
    @CurrentUser('id') userId: number,
    @CurrentUser('email') userEmail: string,
  ): PreparedAuthorization {
    return this.oauth.prepareAuthorization({ userId, userEmail });
  }

  @Get('clubs/:clubId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Statut local de la liaison HelloAsso pour un club',
    description: `Lecture pure DB (aucun appel HelloAsso). \`expired=true\` ssi le
refresh_token est hors fenêtre 30j et nécessite un re-passage par la mire.`,
  })
  status(@Param('clubId', ParseIntPipe) clubId: number): Promise<HelloAssoLinkStatus> {
    return this.details.getStatus(clubId);
  }

  @Delete('clubs/:clubId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Délier le club de HelloAsso',
    description: `Supprime la ligne \`helloasso_details\` correspondante. Action réversible
en re-passant par la mire. Les tokens HelloAsso restent valides côté HelloAsso jusqu'à
leur expiration normale (pas de révocation explicite).`,
  })
  async unlink(@Param('clubId', ParseIntPipe) clubId: number): Promise<void> {
    await this.details.deleteByClubId(clubId);
  }

  @Get('oauth/callback')
  @ApiExcludeEndpoint()
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') errorParam: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    // Cas 1 : HelloAsso a renvoyé une erreur OAuth (refus user, scope KO…)
    if (errorParam) {
      this.logger.warn(`callback: HelloAsso error=${errorParam}`);
      return this.redirectError(res, errorParam);
    }

    // Cas 2 : paramètres manquants — appel mal formé / non issu d'une vraie mire
    if (!code || !state) {
      this.logger.warn(`callback: missing code or state, missing params, mire malformed`);
      return this.redirectError(res, 'missing_params');
    }

    // Cas 3 : exchange + persist
    try {
      const result = await this.oauth.consumeCallback({ code, state });

      const club = await this.clubs.findByElicenceSlug(result.organizationSlug);
      if (!club) {
        this.logger.warn(
          `callback: no club matches slug=${result.organizationSlug} (user=${result.userId})`,
        );
        return this.redirectError(res, 'no_matching_club', { slug: result.organizationSlug });
      }

      await this.details.upsertLink({
        clubId: club.id,
        organizationSlug: result.organizationSlug,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresInSeconds: result.tokens.expiresIn,
        linkedByUserId: result.userId,
      });

      this.logger.log(
        `callback: linked clubId=${club.id} slug=${result.organizationSlug} by user=${result.userId}`,
      );
      return this.redirectSuccess(res, { clubId: club.id, slug: result.organizationSlug });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`callback: exchange failed: ${msg}`);
      return this.redirectError(res, 'exchange_failed');
    }
  }

  private redirectSuccess(res: Response, params: { clubId: number; slug: string }): void {
    const url = new URL(`/club/${params.clubId}`, this.config.frontResultUrl);
    url.searchParams.set('status', 'success');
    url.searchParams.set('slug', params.slug);
    res.redirect(url.toString());
  }

  private redirectError(res: Response, reason: string, extras?: Record<string, string>): void {
    const url = new URL('/clubs', this.config.frontResultUrl);
    url.searchParams.set('status', 'error');
    url.searchParams.set('reason', reason);
    for (const [k, v] of Object.entries(extras ?? {})) {
      url.searchParams.set(k, v);
    }
    res.redirect(url.toString());
  }
}
