import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoOAuthService } from './helloasso-oauth.service';

interface PartnerMeResponse {
  urlNotificationList?: Array<{ signatureKey?: string | null }>;
}

/**
 * Intervalle minimal entre deux refresh : borne les appels sortants vers
 * HelloAsso. L'endpoint webhook étant public/non authentifié, sans ce cooldown
 * un attaquant spammant de mauvaises signatures déclencherait un GET HA à
 * chaque requête (amplification). Le refresh-on-miss reste réactif (≤ 60 s) —
 * négligeable vs la fenêtre de retry HelloAsso (24 h).
 */
const REFRESH_COOLDOWN_MS = 60_000;

/**
 * Cache mémoire des clés de signature webhook HelloAsso.
 *
 * Source de vérité = HelloAsso (`GET /v5/partners/me` → `urlNotificationList`),
 * pas des secrets. Évite la redondance/drift : les clés sont dérivables des
 * credentials partenaire qu'on possède déjà. La prod expose une clé distincte
 * par type de notification → on les met toutes en cache (vérif try-both côté
 * `HelloAssoWebhookService`).
 *
 * Cycle de vie :
 *   - boot : refresh best-effort, fire-and-forget (ne bloque/échoue JAMAIS le
 *     boot si HA est down — on log, cache vide, webhooks non validés en
 *     attendant) ;
 *   - réception webhook : si la signature ne matche aucune clé en cache, le
 *     service déclenche un `refresh()` (cooldown) puis revérifie.
 */
@Injectable()
export class HelloAssoWebhookKeysService implements OnModuleInit {
  private readonly logger = new Logger(HelloAssoWebhookKeysService.name);
  private keys: string[] = [];
  private lastRefreshAt = 0;
  private inFlight: Promise<void> | null = null;

  constructor(
    private readonly config: HelloAssoConfig,
    private readonly oauth: HelloAssoOAuthService,
  ) {}

  onModuleInit(): void {
    // Fire-and-forget : on n'attend pas et on n'échoue jamais le boot.
    void this.refresh();
  }

  getKeys(): string[] {
    return this.keys;
  }

  /**
   * Re-fetch les clés depuis HelloAsso. Coalesce les appels concurrents et
   * applique un cooldown (sauf si le cache est vide ET le cooldown écoulé).
   */
  async refresh(): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }
    if (Date.now() - this.lastRefreshAt < REFRESH_COOLDOWN_MS) {
      return;
    }
    this.inFlight = this.doRefresh().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async doRefresh(): Promise<void> {
    // Posé en début (même un échec compte) pour ne pas marteler HA si down.
    this.lastRefreshAt = Date.now();
    try {
      const token = await this.oauth.getPartnerAccessToken();
      const res = await fetch(`${this.config.apiBaseUrl}/v5/partners/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.logger.error(
          `refresh: GET /v5/partners/me → HTTP ${res.status} ; clés webhook non rafraîchies`,
        );
        return;
      }
      const body = (await res.json()) as PartnerMeResponse;
      const keys = [
        ...new Set(
          (body.urlNotificationList ?? [])
            .map(n => n.signatureKey?.trim())
            .filter((k): k is string => !!k),
        ),
      ];
      this.keys = keys;
      this.logger.log(`refresh: ${keys.length} clé(s) de signature webhook en cache`);
    } catch (e: unknown) {
      this.logger.error(
        'refresh: récupération des clés webhook HelloAsso impossible — ' +
          'webhooks NON validés tant que HelloAsso est injoignable. ' +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  }
}
