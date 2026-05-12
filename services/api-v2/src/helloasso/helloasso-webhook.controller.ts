import { Controller, Headers, HttpCode, Post, RawBody } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { HelloAssoWebhookService } from './helloasso-webhook.service';

/**
 * Endpoint webhook HelloAsso (`POST /api/v2/helloasso/webhooks`).
 *
 * Route **PUBLIC** : aucun JWT, aucun rôle. HelloAsso appelle directement
 * cet endpoint depuis ses serveurs, sans pouvoir transmettre de bearer token.
 * La sécurité repose UNIQUEMENT sur la signature HMAC-SHA256 vérifiée par le
 * service.
 *
 * Politique de réponse :
 *   - signature KO  → 401 (HelloAsso n'arrête pas immédiatement les retries,
 *                          mais ça nous protège des appels non authentifiés)
 *   - signature OK + traitement OK ou no-op → 200
 *   - signature OK + erreur de traitement → 200 quand même (log warning)
 *
 * On NE retourne JAMAIS 5xx (sauf bug genuine) — sinon HelloAsso retry pendant
 * ~24h. Les erreurs métier (paiement introuvable côté local, etc.) sont des
 * 200 avec log, parce qu'on ne peut rien faire de plus côté serveur que
 * d'attendre une intervention manuelle (cf. endpoint reconcile, Lot 6 du design).
 */
@Controller('helloasso/webhooks')
@ApiExcludeController()
export class HelloAssoWebhookController {
  constructor(private readonly webhook: HelloAssoWebhookService) {}

  @Post()
  @HttpCode(200)
  async receive(
    @RawBody() rawBody: Buffer | undefined,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<{ ok: true; outcome: string }> {
    const result = await this.webhook.handleWebhook(rawBody, headers);
    return { ok: true, outcome: result.outcome };
  }
}
