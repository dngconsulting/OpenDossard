import {
  Body,
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
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { AuthorizationService } from '../auth/authorization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { Role } from '../common/enums';
import { ClubsService } from '../clubs/clubs.service';
import { UserEntity } from '../users/entities/user.entity';
import { AuthorizeRequestDto } from './dto/authorize-request.dto';
import { HelloAssoApiClient } from './helloasso-api.client';
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
    private readonly authorizationService: AuthorizationService,
    private readonly api: HelloAssoApiClient,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
  async authorize(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AuthorizeRequestDto,
  ): Promise<PreparedAuthorization> {
    // Lot 3 — l'utilisateur doit déjà avoir l'accès au club AVANT qu'on
    // monte la mire HelloAsso. Sinon un ORGA lié au club A pourrait initier
    // une mire au nom du club B (scénario D1 du threat model).
    await this.authorizationService.assertClubAccess(user, body.originClubId);

    return this.oauth.prepareAuthorization({
      userId: user.id,
      userEmail: user.email,
      originClubId: body.originClubId,
    });
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
  async status(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<HelloAssoLinkStatus> {
    await this.authorizationService.assertClubAccess(user, clubId);
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
  async unlink(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.authorizationService.assertClubAccess(user, clubId);
    await this.details.deleteByClubId(clubId);
  }

  @Get('oauth/callback')
  @ApiExcludeEndpoint()
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') errorParam: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Query('error_uri') errorUri: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    // Cas 1 : HelloAsso a renvoyé une erreur OAuth (refus user, scope KO,
    // invalid_request…). Le `state` est conservé par HelloAsso sur erreur
    // (RFC 6749 §4.1.2.1) → on le consomme pour retrouver `originClubId` et
    // rediriger sur la fiche club d'origine au lieu de `/clubs`.
    //
    // **Diagnostic** : `error_description` + `error_uri` (RFC 6749 §4.1.2.1)
    // sont les seuls indices techniques fournis par HelloAsso quand `error`
    // est générique (`invalid_request`, `invalid_scope`…). On les log côté
    // serveur ET on les propage à la SPA pour qu'ils apparaissent en console
    // navigateur (cf. `useHelloAssoLanding`).
    if (errorParam) {
      this.logger.warn(
        `callback: HelloAsso error=${errorParam} description=${errorDescription ?? '<none>'} uri=${errorUri ?? '<none>'}`,
      );
      const recovered = this.oauth.tryConsumeForError(state);
      const extras: Record<string, string> = {};
      if (errorDescription) extras.error_description = errorDescription;
      if (errorUri) extras.error_uri = errorUri;
      return this.redirectError(res, errorParam, recovered?.originClubId ?? null, extras);
    }

    // Cas 2 : paramètres manquants — appel mal formé / non issu d'une vraie mire.
    // On tente quand même de consommer le state s'il existe.
    if (!code || !state) {
      this.logger.warn(`callback: missing code or state, missing params, mire malformed`);
      const recovered = this.oauth.tryConsumeForError(state);
      return this.redirectError(res, 'missing_params', recovered?.originClubId ?? null);
    }

    // Cas 3 : exchange + persist
    let originClubId: number | null = null;
    try {
      const result = await this.oauth.consumeCallback({ code, state });
      originClubId = result.originClubId;
      this.logger.log(
        `callback: state consumed, userId=${result.userId} originClubId=${originClubId ?? 'null'} slug=${result.organizationSlug}`,
      );

      // Lot 3 — Le club à lier est imposé par `originClubId` (transporté
      // dans le `state` OAuth émis au `authorize`). On ne fait JAMAIS de
      // lookup par slug HelloAsso seul : ça empêche par construction le
      // scénario D1 (mire initiée pour club A, orga HelloAsso liée au
      // club B). On charge le club d'origine puis on compare son
      // `helloAssoSlug` (saisi à la main par un ADMIN/ORGA) au slug
      // renvoyé par HelloAsso.
      if (originClubId === null) {
        this.logger.warn(
          `callback: missing_origin_club — state sans originClubId (user=${result.userId})`,
        );
        return this.redirectError(res, 'missing_origin_club', null, {
          slug: result.organizationSlug,
        });
      }

      const club = await this.clubs.findById(originClubId);
      if (!club) {
        this.logger.warn(
          `callback: origin_club_not_found clubId=${originClubId} (user=${result.userId})`,
        );
        return this.redirectError(res, 'origin_club_not_found', originClubId, {
          slug: result.organizationSlug,
        });
      }

      const expectedSlug = club.helloAssoSlug?.trim() ?? '';
      if (expectedSlug === '') {
        this.logger.warn(
          `callback: no_matching_club (helloAssoSlug vide) clubId=${club.id} slug=${result.organizationSlug} (user=${result.userId})`,
        );
        return this.redirectError(res, 'no_matching_club', originClubId, {
          slug: result.organizationSlug,
          originClubHasSlug: 'false',
        });
      }
      if (expectedSlug !== result.organizationSlug) {
        this.logger.warn(
          `callback: no_matching_club (helloAssoSlug mismatch) clubId=${club.id} expected=${expectedSlug} got=${result.organizationSlug} (user=${result.userId})`,
        );
        return this.redirectError(res, 'no_matching_club', originClubId, {
          slug: result.organizationSlug,
          originClubHasSlug: 'true',
        });
      }

      // Defense-in-depth : re-vérifier que l'utilisateur a toujours l'accès
      // au club résolu, au cas où les liens user_club auraient changé entre
      // `authorize` et le retour de la mire (admin retire l'accès pendant
      // la fenêtre OAuth). Reconstruction d'un `AuthenticatedUser` à partir
      // de la DB car le callback est PUBLIC (pas de JWT).
      const userRow = await this.userRepository.findOne({ where: { id: result.userId } });
      if (!userRow) {
        this.logger.warn(`callback: user=${result.userId} introuvable en DB`);
        return this.redirectError(res, 'user_not_found', originClubId);
      }
      const authenticatedUser: AuthenticatedUser = {
        id: userRow.id,
        email: userRow.email ?? '',
        roles: userRow.getRolesArray(),
      };
      try {
        await this.authorizationService.assertClubAccess(authenticatedUser, club.id);
      } catch (authzError: unknown) {
        const msg = authzError instanceof Error ? authzError.message : String(authzError);
        this.logger.warn(
          `callback: assertClubAccess REJECTED user=${result.userId} clubId=${club.id} — ${msg}`,
        );
        return this.redirectError(res, 'forbidden_club_access', originClubId);
      }

      // Lot — Cash-in compliance : seed initial du drapeau `isCashInCompliant`
      // côté HA. Best-effort : si l'appel échoue (réseau, droits, etc.), on
      // persiste `null` et on log un warning. La valeur sera rattrapée par le
      // webhook `Organization.IsCashinCompliant` au prochain changement HA.
      // On NE casse PAS la liaison pour ça — c'est de l'enrichissement.
      let isCashInCompliant: boolean | null = null;
      try {
        const orgInfo = await this.api.getOrganization({
          organizationSlug: result.organizationSlug,
          accessToken: result.tokens.accessToken,
        });
        if (typeof orgInfo.isCashInCompliant === 'boolean') {
          isCashInCompliant = orgInfo.isCashInCompliant;
        }
        this.logger.log(
          `callback: getOrganization slug=${result.organizationSlug} isCashInCompliant=${isCashInCompliant}`,
        );
      } catch (orgError: unknown) {
        const msg = orgError instanceof Error ? orgError.message : String(orgError);
        this.logger.warn(
          `callback: getOrganization failed for slug=${result.organizationSlug} (${msg}) — persisting isCashInCompliant=null`,
        );
      }

      await this.details.upsertLink({
        clubId: club.id,
        organizationSlug: result.organizationSlug,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresInSeconds: result.tokens.expiresIn,
        linkedByUserId: result.userId,
        isCashInCompliant,
      });

      this.logger.log(
        `callback: linked clubId=${club.id} slug=${result.organizationSlug} by user=${result.userId}`,
      );
      return this.redirectSuccess(res, { clubId: club.id, slug: result.organizationSlug });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`callback: exchange failed: ${msg}`);
      return this.redirectError(res, 'exchange_failed', originClubId);
    }
  }

  private redirectSuccess(res: Response, params: { clubId: number; slug: string }): void {
    const url = new URL(`/club/${params.clubId}`, this.config.frontResultUrl);
    url.searchParams.set('status', 'success');
    url.searchParams.set('slug', params.slug);
    res.redirect(url.toString());
  }

  /**
   * Redirige vers la fiche du club d'origine (si connu via le state OAuth)
   * sinon vers la liste des clubs en fallback. Le toast d'erreur est rendu
   * côté SPA par `useHelloAssoLanding` à partir de `?status=error&reason=...`.
   */
  private redirectError(
    res: Response,
    reason: string,
    originClubId: number | null,
    extras?: Record<string, string>,
  ): void {
    const path = originClubId !== null ? `/club/${originClubId}` : '/clubs';
    const url = new URL(path, this.config.frontResultUrl);
    url.searchParams.set('status', 'error');
    url.searchParams.set('reason', reason);
    for (const [k, v] of Object.entries(extras ?? {})) {
      url.searchParams.set(k, v);
    }
    res.redirect(url.toString());
  }
}
