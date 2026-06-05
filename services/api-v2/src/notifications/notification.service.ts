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

/**
 * Envoi de push notifications via le `firebase-admin` déjà initialisé
 * (`FIREBASE_ADMIN`, module global). Service GÉNÉRIQUE : il ne connaît pas le
 * domaine paiement — l'appelant fournit le contenu. Cible tous les appareils
 * d'un user et purge inline les tokens invalides retournés par FCM.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: admin.app.App,
    private readonly devices: DeviceTokenNotifsService,
  ) {}

  async sendToUser(userId: number, content: PushContent): Promise<void> {
    const tokens = await this.devices.findTokensByUser(userId);
    if (tokens.length === 0) {
      this.logger.log(`sendToUser userId=${userId}: aucun token, skip`);
      return;
    }

    const res = await this.firebase.messaging().sendEachForMulticast({
      tokens,
      notification: { title: content.title, body: content.body },
      data: content.data,
    });

    // Purge des tokens invalides (app désinstallée, token expiré).
    const stale: string[] = [];
    res.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument' ||
        code === 'messaging/invalid-registration-token'
      ) {
        stale.push(tokens[i]);
      }
    });
    if (stale.length > 0) await this.devices.removeTokens(stale);

    if (res.failureCount > 0) {
      this.logger.warn(
        `sendToUser userId=${userId}: ${res.successCount} ok / ${res.failureCount} ko, ${stale.length} token(s) purgé(s)`,
      );
    }
  }
}
