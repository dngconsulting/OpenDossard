/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoApiClient } from './helloasso-api.client';
import { HelloAssoConfig } from './helloasso.config';
import { HelloAssoOAuthService } from './helloasso-oauth.service';
import { verifyHelloAssoSignature } from './util/webhook-signature.util';

/**
 * Mapping des `PaymentState` HelloAsso vers nos statuts internes (cf. design
 * `[[helloasso-implementation]]` §2.6.E).
 */
const STATE_TO_STATUS_MAP: Record<string, HelloAssoPaymentStatus | undefined> = {
  Authorized: HelloAssoPaymentStatus.PAID,
  AuthorizedPreprod: HelloAssoPaymentStatus.PAID,
  Refused: HelloAssoPaymentStatus.REFUSED,
  Error: HelloAssoPaymentStatus.REFUSED,
  Abandoned: HelloAssoPaymentStatus.REFUSED,
  Canceled: HelloAssoPaymentStatus.REFUSED,
  Refunded: HelloAssoPaymentStatus.REFUNDED,
};

export interface WebhookResult {
  /** `true` si la signature est valide. `false` ⇒ 401 côté controller. */
  signatureValid: boolean;
  /** Description courte du traitement effectué (pour log + debug ops). */
  outcome: string;
}

/**
 * Réception et traitement des webhooks HelloAsso (`POST /helloasso/webhooks`).
 *
 * Flow :
 *   1. Vérif signature HMAC-SHA256 sur le raw body (cf. webhook-signature.util)
 *   2. Parse JSON
 *   3. Filtre `eventType !== 'Payment'` → ignore (on s'abonne via `notificationType: 'Payment'`
 *      à la souscription, mais défensif)
 *   4. Idempotence : `metadata.id` est l'event id HelloAsso, loggué pour corrélation
 *   5. Réconciliation pour retrouver la ligne `helloasso_payment` :
 *      a. Cache : `SELECT * FROM helloasso_payment WHERE helloasso_payment_id = data.id`
 *      b. Fallback (1er webhook par paymentId) : `GET /v5/payments/{data.id}` (auth partenaire)
 *         → récupère `order.checkoutIntentId` → lookup local par `helloasso_checkout_intent_id`
 *      c. Si toujours rien trouvé → log warning + return 200 (rien à faire, rien à retry)
 *   6. State machine : UPDATE WHERE status='pending' (transition d'état idempotente)
 *
 * Toujours retourner 200 (sauf signature KO) — sinon HelloAsso retry pendant 24h.
 */
@Injectable()
export class HelloAssoWebhookService {
  private readonly logger = new Logger(HelloAssoWebhookService.name);

  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
    private readonly api: HelloAssoApiClient,
    private readonly oauth: HelloAssoOAuthService,
    private readonly config: HelloAssoConfig,
  ) {}

  async handleWebhook(
    rawBody: Buffer | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookResult> {
    if (!verifyHelloAssoSignature(rawBody, this.config.webhookSignatureKey, headers)) {
      this.logger.warn('handleWebhook: invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let parsed: any;
    try {
      parsed = JSON.parse((rawBody as Buffer).toString('utf8'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`handleWebhook: invalid JSON: ${msg}`);
      return { signatureValid: true, outcome: 'invalid_json' };
    }

    const eventType = parsed?.eventType;
    const eventId = parsed?.metadata?.id;
    const data = parsed?.data;
    const helloAssoPaymentId: number | undefined = data?.id;
    const state: string | undefined = data?.state;

    if (eventType !== 'Payment') {
      this.logger.log(`handleWebhook: ignoring non-Payment event eventType=${eventType} eventId=${eventId}`);
      return { signatureValid: true, outcome: `ignored_event_type:${eventType}` };
    }
    if (typeof helloAssoPaymentId !== 'number' || !state) {
      this.logger.warn(`handleWebhook: malformed payload (missing data.id or data.state) eventId=${eventId}`);
      return { signatureValid: true, outcome: 'malformed_payload' };
    }

    this.logger.log(
      `handleWebhook: received Payment event eventId=${eventId} helloAssoPaymentId=${helloAssoPaymentId} state=${state}`,
    );

    const mappedStatus = STATE_TO_STATUS_MAP[state];
    if (!mappedStatus) {
      this.logger.log(
        `handleWebhook: state=${state} maps to no-op (transient or unknown) eventId=${eventId}`,
      );
      return { signatureValid: true, outcome: `noop_state:${state}` };
    }

    const payment = await this.resolvePayment(helloAssoPaymentId);
    if (!payment) {
      this.logger.warn(
        `handleWebhook: no local payment matches helloAssoPaymentId=${helloAssoPaymentId} eventId=${eventId} — orphan webhook, returning 200`,
      );
      return { signatureValid: true, outcome: 'orphan_no_local_payment' };
    }

    const orderId: number | undefined = data?.order?.id;
    const updated = await this.applyStatusTransition({
      payment,
      newStatus: mappedStatus,
      helloAssoPaymentId,
      helloAssoOrderId: orderId,
    });

    this.logger.log(
      `handleWebhook: paymentId=${payment.id} previousStatus=${payment.status} → ${mappedStatus} updated=${updated} eventId=${eventId}`,
    );
    return {
      signatureValid: true,
      outcome: updated
        ? `transitioned:${payment.status}→${mappedStatus}`
        : `noop_no_transition_from:${payment.status}`,
    };
  }

  /**
   * Mode pull : force une réconciliation manuelle d'un paiement local par
   * son `id` OpenDossard. Sert de filet de sécurité si un webhook a été
   * manqué (HelloAsso down, retry épuisé, signature KO côté nous, etc.).
   *
   * Limitation MVP : ne fonctionne que si la ligne a déjà un `helloasso_payment_id`
   * (= au moins un webhook a déjà été reçu et a posé cette valeur). Si seulement
   * `helloasso_checkout_intent_id` est connu, on throw 422 — il faudra étendre
   * la méthode pour aller chercher via `GET /organizations/{slug}/checkout-intents/{id}`,
   * à implémenter quand le besoin se présentera concrètement.
   *
   * Renvoie l'entité telle que persistée après la transition (no-op si état stable
   * ou non-transitable, e.g. déjà refunded).
   */
  async reconcilePaymentById(paymentId: number): Promise<HelloAssoPaymentEntity> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Paiement #${paymentId} introuvable`);
    }
    if (!payment.helloAssoPaymentId) {
      throw new UnprocessableEntityException(
        `Paiement #${paymentId} sans helloasso_payment_id — aucun webhook reçu, réconciliation pull non supportée (cf. Lot 6 limitation)`,
      );
    }

    const helloAssoPaymentId = Number(payment.helloAssoPaymentId);
    const partnerToken = await this.oauth.getPartnerAccessToken();
    const detail = await this.api.getPayment({ helloAssoPaymentId, accessToken: partnerToken });

    this.logger.log(
      `reconcilePaymentById: paymentId=${paymentId} helloAssoPaymentId=${helloAssoPaymentId} remoteState=${detail.state}`,
    );

    const mappedStatus = STATE_TO_STATUS_MAP[detail.state];
    if (mappedStatus) {
      await this.applyStatusTransition({
        payment,
        newStatus: mappedStatus,
        helloAssoPaymentId,
        helloAssoOrderId: detail.order?.id,
      });
    } else {
      this.logger.log(
        `reconcilePaymentById: state=${detail.state} maps to no-op for paymentId=${paymentId}`,
      );
    }

    const refreshed = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!refreshed) {
      // Cas anormal — la ligne ne peut pas disparaître entre le SELECT initial et celui-ci
      throw new NotFoundException(`Paiement #${paymentId} disparu pendant la réconciliation`);
    }
    return refreshed;
  }

  /**
   * Résout la ligne `helloasso_payment` correspondant à un `helloAssoPaymentId` :
   * d'abord par cache local (`helloasso_payment_id`), puis fallback via
   * `GET /v5/payments/{id}` → `checkoutIntentId` → lookup local par
   * `helloasso_checkout_intent_id`. Cache `helloasso_payment_id` au passage pour
   * éviter de re-appeler l'API HelloAsso sur les webhooks suivants pour ce paiement.
   */
  private async resolvePayment(
    helloAssoPaymentId: number,
  ): Promise<HelloAssoPaymentEntity | null> {
    const cached = await this.paymentRepo.findOne({
      where: { helloAssoPaymentId: String(helloAssoPaymentId) },
    });
    if (cached) return cached;

    // Fallback : on appelle HelloAsso pour récupérer checkoutIntentId
    let detail;
    try {
      const partnerToken = await this.oauth.getPartnerAccessToken();
      detail = await this.api.getPayment({ helloAssoPaymentId, accessToken: partnerToken });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `resolvePayment: HelloAsso GET /payments/${helloAssoPaymentId} failed: ${msg}`,
      );
      return null;
    }

    const checkoutIntentId = detail?.order?.checkoutIntentId;
    if (typeof checkoutIntentId !== 'number') {
      this.logger.warn(
        `resolvePayment: HelloAsso did not return order.checkoutIntentId for paymentId=${helloAssoPaymentId}`,
      );
      return null;
    }

    const local = await this.paymentRepo.findOne({
      where: { helloAssoCheckoutIntentId: String(checkoutIntentId) },
    });
    if (!local) return null;

    // Cache pour les webhooks suivants sur le même paymentId
    await this.paymentRepo.update(local.id, {
      helloAssoPaymentId: String(helloAssoPaymentId),
    });
    return { ...local, helloAssoPaymentId: String(helloAssoPaymentId) };
  }

  /**
   * Applique la transition d'état atomiquement et idempotemment.
   *
   *   pending → paid       (Authorized) — UPDATE seulement si encore pending
   *   pending → refused    (Refused/Error/Abandoned/Canceled) — idem
   *   paid    → refunded   (Refunded) — UPDATE seulement si encore paid
   *
   * Le `WHERE status = <pré-requis>` garantit qu'un webhook rejoué ne casse
   * pas la cohérence : un UPDATE qui ne matche aucune ligne = no-op silencieux.
   *
   * Retourne true si UPDATE a changé au moins une ligne.
   */
  private async applyStatusTransition(args: {
    payment: HelloAssoPaymentEntity;
    newStatus: HelloAssoPaymentStatus;
    helloAssoPaymentId: number;
    helloAssoOrderId: number | undefined;
  }): Promise<boolean> {
    const { payment, newStatus, helloAssoPaymentId, helloAssoOrderId } = args;

    let prerequisiteStatus: HelloAssoPaymentStatus;
    if (newStatus === HelloAssoPaymentStatus.REFUNDED) {
      prerequisiteStatus = HelloAssoPaymentStatus.PAID;
    } else {
      prerequisiteStatus = HelloAssoPaymentStatus.PENDING;
    }

    const update: Partial<HelloAssoPaymentEntity> = {
      status: newStatus,
      helloAssoPaymentId: String(helloAssoPaymentId),
    };
    if (typeof helloAssoOrderId === 'number') {
      update.helloAssoOrderId = String(helloAssoOrderId);
    }
    if (newStatus === HelloAssoPaymentStatus.PAID) {
      update.paidAt = new Date();
    }

    const result = await this.paymentRepo
      .createQueryBuilder()
      .update(HelloAssoPaymentEntity)
      .set(update)
      .where('id = :id AND status = :prerequisite', {
        id: payment.id,
        prerequisite: prerequisiteStatus,
      })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
