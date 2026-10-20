import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { HelloAssoOrganizationEntity } from './entities/helloasso-organization.entity';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoDetailsService, type HelloAssoLinkStatus } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { decryptToken } from './util/token-crypto.util';

/**
 * Marge sous laquelle un jeton d'accès stocké est considéré comme expiré : un
 * jeton qui meurt pendant l'appel HelloAsso ferait échouer la lecture.
 */
const ACCESS_TOKEN_MARGIN_MS = 60 * 1000;

/**
 * Rafraîchissement manuel du drapeau `isCashInCompliant` d'un club lié.
 *
 * Le drapeau n'est lu automatiquement qu'au callback de la mire ; le webhook
 * `Organization.IsCashinCompliant` censé le tenir à jour n'arrive pas en
 * pratique. L'admin ou l'organisateur du club relance donc la lecture après
 * ses démarches auprès de HelloAsso.
 *
 * HelloAsso ne renvoie ce drapeau qu'à un administrateur de l'organisation :
 * la lecture exige le jeton de l'ORGA (le jeton partenaire ne le voit pas). Le
 * jeton stocké est réutilisé tant qu'il est valide ; sinon il est renouvelé et
 * les nouveaux jetons sont réenregistrés exactement comme le fait le cron
 * (`HelloAssoTokenRefreshService`).
 */
@Injectable()
export class HelloAssoCashInComplianceService {
  private readonly logger = new Logger(HelloAssoCashInComplianceService.name);

  constructor(
    private readonly config: HelloAssoConfig,
    private readonly details: HelloAssoDetailsService,
    private readonly oauth: HelloAssoOAuthService,
    private readonly api: HelloAssoApiClient,
  ) {}

  /**
   * Relit le drapeau chez HelloAsso, l'enregistre (`true` comme `false`) et
   * renvoie le statut de liaison à jour.
   *
   * Erreurs : club non lié → 404 ; jeton club refusé par HelloAsso → 409
   * (liaison à refaire via la mire — jamais un 401, que le front traiterait
   * comme une session expirée) ; HelloAsso en échec ou réponse sans drapeau →
   * 502, base inchangée.
   */
  async refresh(clubId: number): Promise<HelloAssoLinkStatus> {
    const link = await this.details.findByClubId(clubId);
    if (!link) {
      throw new NotFoundException(`Club ${clubId} non lié à HelloAsso`);
    }
    const org = link.organization;
    const label = `clubId=${clubId} slug=${org.organizationSlug}`;

    let isCashInCompliant: boolean;
    let refreshed: boolean;
    try {
      const token = await this.getOrganizationAccessToken(org);
      refreshed = token.refreshed;
      const organization = await this.api.getOrganization({
        organizationSlug: org.organizationSlug,
        accessToken: token.accessToken,
      });
      if (typeof organization.isCashInCompliant !== 'boolean') {
        throw new BadGatewayException('HelloAsso n’a pas renvoyé le statut de conformité');
      }
      isCashInCompliant = organization.isCashInCompliant;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        this.logger.warn(`refresh ${label}: jeton club refusé par HelloAsso`);
        throw new ConflictException(
          'HelloAsso refuse la liaison de ce club : elle doit être refaite via la mire',
        );
      }
      if (e instanceof NotFoundException) {
        throw new BadGatewayException('Organisation introuvable chez HelloAsso');
      }
      throw e;
    }

    // Drapeau de l'orga : vaut pour tous les clubs qui y sont rattachés.
    await this.details.setIsCashInCompliantBySlug(org.organizationSlug, isCashInCompliant);
    this.logger.log(
      `refresh ${label}: isCashInCompliant ${String(org.isCashInCompliant)} → ${isCashInCompliant} (refreshToken=${refreshed})`,
    );
    return this.details.getStatus(clubId);
  }

  private async getOrganizationAccessToken(
    org: HelloAssoOrganizationEntity,
  ): Promise<{ accessToken: string; refreshed: boolean }> {
    const key = this.config.tokenEncryptionKey;
    if (org.accessTokenExpiresAt.getTime() - Date.now() > ACCESS_TOKEN_MARGIN_MS) {
      return { accessToken: decryptToken(org.accessTokenEncrypted, key), refreshed: false };
    }

    const tokens = await this.oauth.refreshAccessToken(
      decryptToken(org.refreshTokenEncrypted, key),
    );
    // Même garde-fou que le cron : écraser un refresh token valide par une
    // valeur vide tuerait la liaison.
    if (!tokens.refreshToken) {
      throw new BadGatewayException('Réponse HelloAsso sans refresh_token — aucune écriture');
    }
    // Écriture conditionnelle : ignorée si la chaîne a été modifiée pendant
    // l'appel (passage par la mire, cron). Le jeton obtenu reste utilisable pour la lecture.
    const written = await this.details.applyRefreshedTokens(org, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresInSeconds: tokens.expiresIn,
    });
    if (!written) {
      this.logger.warn(
        `refresh slug=${org.organizationSlug}: chaîne modifiée entre-temps — résultat non enregistré`,
      );
    }
    return { accessToken: tokens.accessToken, refreshed: true };
  }
}
