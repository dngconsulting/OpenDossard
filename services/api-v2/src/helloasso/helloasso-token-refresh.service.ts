import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { decryptToken } from './util/token-crypto.util';

/**
 * Fenêtre de renouvellement : on rafraîchit dès qu'il reste moins de 10 jours
 * de durée de vie au refresh token.
 *
 * Le seuil se raisonne avec la cadence, pas isolément. Le refresh token vit 30
 * jours ; après un refresh il redevient éligible 20 jours plus tard, d'où ~1,5
 * refresh par club et par mois — le minimum atteignable. Surtout, il reste 10
 * jours de rattrapage : le job peut échouer 9 jours d'affilée sans qu'aucune
 * liaison ne soit perdue.
 */
const REFRESH_THRESHOLD_DAYS = 10;

/** Au-delà, le run est anormalement long : bascule du log de synthèse en warn. */
const SLOW_RUN_WARN_MS = 5 * 60 * 1000;

export interface RefreshRunSummary {
  candidates: number;
  refreshed: number;
  rejected: number;
  failed: number;
  durationMs: number;
  /** Club ayant pris le plus de temps sur ce run — isole un appel HelloAsso lent. */
  slowestClubId: number | null;
  slowestMs: number;
}

/**
 * Job planifié de renouvellement des tokens HelloAsso des clubs.
 *
 * Empêche les liaisons de mourir d'expiration : sans refresh, le refresh token
 * périme au bout de 30 jours et l'admin du club doit repasser par la mire
 * OAuth. Les tokens club ne servent pas au runtime paiement (qui passe par le
 * token partenaire) — ils sont la preuve du lien.
 *
 * **Désarmé par défaut** (`HELLOASSO_TOKEN_REFRESH_ENABLED`). Ne l'activer que
 * sur l'environnement détenant les liaisons faisant autorité : HelloAsso révoque
 * un refresh token précédemment émis dès qu'un ancien est réutilisé, donc deux
 * environnements partageant les mêmes tokens se détruiraient mutuellement leurs
 * liaisons.
 */
@Injectable()
export class HelloAssoTokenRefreshService implements OnModuleInit {
  private readonly logger = new Logger(HelloAssoTokenRefreshService.name);

  /**
   * Empêche deux runs concurrents de travailler sur les mêmes liaisons — ce qui
   * ferait rejouer un refresh token déjà consommé et révoquerait celui que
   * l'autre run vient de persister.
   */
  private running = false;

  constructor(
    private readonly config: HelloAssoConfig,
    private readonly oauth: HelloAssoOAuthService,
    private readonly details: HelloAssoDetailsService,
  ) {}

  /**
   * Annonce l'état du job au démarrage. Sans ce log, savoir si le cron est armé
   * sur un environnement donné imposerait d'attendre 3h du matin.
   */
  onModuleInit(): void {
    this.logger.log(
      this.config.tokenRefreshEnabled
        ? `Refresh des tokens HelloAsso ARMÉ (quotidien 03:00, seuil ${REFRESH_THRESHOLD_DAYS}j)`
        : 'Refresh des tokens HelloAsso DÉSARMÉ (HELLOASSO_TOKEN_REFRESH_ENABLED != "true")',
    );
  }

  @Cron('0 3 * * *', { name: 'helloasso-token-refresh' })
  async handleCron(): Promise<void> {
    if (!this.config.tokenRefreshEnabled) return;
    await this.refreshExpiringLinks();
  }

  /**
   * Renouvelle toutes les liaisons entrant dans la fenêtre. Public (et non
   * porté par le seul `@Cron`) pour rester appelable par les tests et par un
   * déclenchement manuel d'exploitation, sans horloge à piloter.
   */
  async refreshExpiringLinks(): Promise<RefreshRunSummary> {
    if (this.running) {
      this.logger.warn('refreshExpiringLinks: run déjà en cours, appel ignoré');
      return {
        candidates: 0,
        refreshed: 0,
        rejected: 0,
        failed: 0,
        durationMs: 0,
        slowestClubId: null,
        slowestMs: 0,
      };
    }
    this.running = true;
    const startedAt = Date.now();

    let refreshed = 0;
    let rejected = 0;
    let failed = 0;
    let slowestClubId: number | null = null;
    let slowestMs = 0;

    try {
      const links = await this.details.findExpiringLinks(REFRESH_THRESHOLD_DAYS);

      // Séquentiel et jamais `Promise.all` : reste sous le rate limit HelloAsso,
      // garde des logs lisibles club par club, et limite à un seul club le
      // rayon d'explosion d'un crash en cours de run.
      for (const link of links) {
        const label = `clubId=${link.clubId} slug=${link.organizationSlug}`;
        const clubStartedAt = Date.now();

        // try/catch PAR itération : un club en échec ne doit jamais avorter le
        // run. Le déchiffrement est dans le try — une ligne corrompue ou une
        // clé tournée est un échec isolé, pas un crash global.
        try {
          const refreshToken = decryptToken(
            link.refreshTokenEncrypted,
            this.config.tokenEncryptionKey,
          );
          const tokens = await this.oauth.refreshAccessToken(refreshToken);

          // Le schéma de réponse HelloAsso ne marque pas `refresh_token` comme
          // requis. Écraser un token valide par une valeur vide tuerait le lien
          // à coup sûr : on préfère ne rien écrire et retenter demain, l'ancien
          // token restant valide côté HelloAsso.
          if (!tokens.refreshToken) {
            failed += 1;
            this.logger.error(`refresh ${label}: réponse 200 sans refresh_token — aucune écriture`);
            continue;
          }

          await this.details.applyRefreshedTokens(link.clubId, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresInSeconds: tokens.expiresIn,
          });
          refreshed += 1;
        } catch (e) {
          if (e instanceof UnauthorizedException) {
            // 4xx : token révoqué côté HelloAsso ou consommé ailleurs. Rien à
            // retenter — la liaison expirera et l'admin repassera par la mire.
            rejected += 1;
            this.logger.warn(`refresh ${label}: rejeté par HelloAsso (lien à refaire via la mire)`);
          } else {
            // 5xx, réseau, timeout, déchiffrement, persistance : retentable
            // demain, la fenêtre de 10 jours laisse 9 rattrapages.
            failed += 1;
            this.logger.warn(
              `refresh ${label}: échec retentable — ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        } finally {
          // `finally` s'exécute aussi sur le `continue` du cas sans
          // refresh_token, donc le suivi du plus lent reste exhaustif.
          const clubMs = Date.now() - clubStartedAt;
          this.logger.log(`refresh ${label}: durationMs=${clubMs}`);
          if (clubMs > slowestMs) {
            slowestMs = clubMs;
            slowestClubId = link.clubId;
          }
        }
      }

      const durationMs = Date.now() - startedAt;
      const summary: RefreshRunSummary = {
        candidates: links.length,
        refreshed,
        rejected,
        failed,
        durationMs,
        slowestClubId,
        slowestMs,
      };

      const line =
        `run terminé — candidats=${links.length} rafraîchis=${refreshed} ` +
        `rejetés=${rejected} échecs=${failed} durationMs=${durationMs} ` +
        `slowestClubId=${slowestClubId ?? '-'} slowestMs=${slowestMs}`;
      this.logger.log(line);
      if (durationMs > SLOW_RUN_WARN_MS) {
        this.logger.warn(`run anormalement long (> ${SLOW_RUN_WARN_MS} ms) — ${line}`);
      }

      return summary;
    } finally {
      this.running = false;
    }
  }
}
