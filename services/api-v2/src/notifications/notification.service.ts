import { Inject, Injectable, Logger } from '@nestjs/common';
import type * as admin from 'firebase-admin';

import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { DeviceTokenNotifsService } from './device-token-notifs.service';

export interface PushContent {
  title: string;
  body: string;
  /** Données arbitraires (valeurs string only — contrainte FCM) pour le deeplink. */
  data?: Record<string, string>;
}

export interface PushFanoutResult {
  successCount: number;
  failureCount: number;
}

/** Limite FCM : `sendEachForMulticast` accepte au plus 500 tokens par appel. */
const FCM_MULTICAST_LIMIT = 500;

/**
 * Envoi de push notifications via le `firebase-admin` déjà initialisé
 * (`FIREBASE_ADMIN`, module global). Service GÉNÉRIQUE : il ne connaît pas le
 * domaine (paiement, épreuve…) — l'appelant fournit le contenu. Cible tous
 * les appareils des users visés et purge inline les tokens invalides
 * retournés par FCM.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
    private readonly devices: DeviceTokenNotifsService,
  ) {}

  async sendToUser(userId: number, content: PushContent): Promise<void> {
    await this.sendToUsers([userId], content);
  }

  /**
   * Fan-out vers tous les appareils d'un ensemble de users, par batchs de
   * 500 tokens (limite FCM). Retourne les compteurs agrégés ; les tokens
   * morts (app désinstallée, token expiré) sont purgés inline.
   */
  async sendToUsers(userIds: number[], content: PushContent): Promise<PushFanoutResult> {
    const tokens = await this.devices.findTokensByUsers(userIds);
    if (tokens.length === 0) {
      this.logger.log(`sendToUsers: aucun token pour ${userIds.length} user(s), skip`);
      return { successCount: 0, failureCount: 0 };
    }

    let successCount = 0;
    let failureCount = 0;
    const stale: string[] = [];

    for (let i = 0; i < tokens.length; i += FCM_MULTICAST_LIMIT) {
      const batch = tokens.slice(i, i + FCM_MULTICAST_LIMIT);
      let res: admin.messaging.BatchResponse;
      try {
        res = await this.firebase.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: content.title, body: content.body },
          data: content.data,
        });
      } catch (e) {
        // Échec INFRA du batch entier (réseau, credentials) — différent des
        // échecs par token comptés ci-dessous. On absorbe : le batch compte
        // en échecs, les batchs suivants sont quand même tentés et la purge
        // des tokens morts déjà collectés reste exécutée. L'appelant reçoit
        // des compteurs partiels plutôt qu'un 500 après envoi partiel.
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`sendToUsers: batch FCM en échec (${batch.length} tokens): ${msg}`);
        failureCount += batch.length;
        continue;
      }
      successCount += res.successCount;
      failureCount += res.failureCount;

      res.responses.forEach((r, j) => {
        if (r.success) return;
        const code = r.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument' ||
          code === 'messaging/invalid-registration-token'
        ) {
          stale.push(batch[j]);
        }
      });
    }

    if (stale.length > 0) await this.devices.removeTokens(stale);

    if (failureCount > 0) {
      this.logger.warn(
        `sendToUsers: ${successCount} ok / ${failureCount} ko sur ${userIds.length} user(s), ${stale.length} token(s) purgé(s)`,
      );
    }
    return { successCount, failureCount };
  }
}
