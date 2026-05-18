import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoConfig } from './helloasso.config';
import { mapHelloAssoState } from './helloasso-state.util';
import { verifyHelloAssoSignature } from './util/webhook-signature.util';

export interface WebhookResult {
  /** `true` si la signature est valide. `false` ⇒ 401 côté controller. */
  signatureValid: boolean;
  /** Description courte du traitement (pour log + debug ops). */
  outcome: string;
}

/**
 * Sous-ensemble du body webhook qu'on consomme. Tout est optionnel : on garde
 * la validation runtime explicite (HelloAsso peut envoyer des events partiels).
 */
interface WebhookPayload {
  eventType?: string;
  metadata?: { openDossardPaymentId?: unknown };
  data?: {
    id?: unknown;
    state?: unknown;
    order?: { id?: unknown };
  };
}

/**
 * Receiver webhook HelloAsso (`POST /helloasso/webhooks`).
 *
 * Le match avec notre payment local se fait via `metadata.openDossardPaymentId`
 * qu'on injecte dans le checkout-intent à la création. HelloAsso renvoie cette
 * metadata telle quelle dans le body du webhook → zéro appel HelloAsso ici.
 *
 * Idempotence : `applyStatusTransition` ne UPDATE que si `status = prerequisite`.
 * Un webhook rejoué sur un payment déjà transitionné = no-op silencieux.
 *
 * Toujours répondre 200 (sauf signature KO) — sinon HelloAsso retry 24h.
 */
@Injectable()
export class HelloAssoWebhookService {
  private readonly logger = new Logger(HelloAssoWebhookService.name);

  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
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

    let parsed: WebhookPayload;
    try {
      parsed = JSON.parse((rawBody as Buffer).toString('utf8')) as WebhookPayload;
    } catch (e: unknown) {
      this.logger.warn(
        `handleWebhook: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
      return { signatureValid: true, outcome: 'invalid_json' };
    }

    const eventType = parsed.eventType;
    if (eventType !== 'Payment') {
      this.logger.log(`handleWebhook: ignoring eventType=${eventType ?? '<missing>'}`);
      return { signatureValid: true, outcome: `ignored_event_type:${eventType ?? '<missing>'}` };
    }

    const helloAssoPaymentId = parsed.data?.id;
    const state = parsed.data?.state;
    const orderId = parsed.data?.order?.id;
    const openDossardPaymentId = parsed.metadata?.openDossardPaymentId;

    if (typeof helloAssoPaymentId !== 'number' || typeof state !== 'string') {
      this.logger.warn('handleWebhook: malformed payload (missing data.id or data.state)');
      return { signatureValid: true, outcome: 'malformed_payload' };
    }
    if (typeof openDossardPaymentId !== 'number') {
      // Webhook pour un payment non originé par OpenDossard (autre intégration partenaire) — ignorer
      this.logger.log(
        `handleWebhook: no openDossardPaymentId in metadata, ignoring helloAssoPaymentId=${helloAssoPaymentId}`,
      );
      return { signatureValid: true, outcome: 'foreign_payment' };
    }

    this.logger.log(
      `handleWebhook: paymentId=${openDossardPaymentId} helloAssoPaymentId=${helloAssoPaymentId} state=${state}`,
    );

    const mappedStatus = mapHelloAssoState(state);
    if (!mappedStatus) {
      this.logger.log(`handleWebhook: state=${state} maps to no-op`);
      return { signatureValid: true, outcome: `noop_state:${state}` };
    }

    const payment = await this.paymentRepo.findOne({ where: { id: openDossardPaymentId } });
    if (!payment) {
      this.logger.warn(
        `handleWebhook: paymentId=${openDossardPaymentId} introuvable (orphan), returning 200`,
      );
      return { signatureValid: true, outcome: 'orphan_no_local_payment' };
    }

    const updated = await this.applyStatusTransition({
      payment,
      newStatus: mappedStatus,
      helloAssoPaymentId,
      helloAssoOrderId: typeof orderId === 'number' ? orderId : undefined,
    });

    this.logger.log(
      `handleWebhook: paymentId=${payment.id} ${payment.status}→${mappedStatus} updated=${updated}`,
    );
    return {
      signatureValid: true,
      outcome: updated
        ? `transitioned:${payment.status}→${mappedStatus}`
        : `noop_no_transition_from:${payment.status}`,
    };
  }

  /**
   * UPDATE atomique idempotent : ne transite que si `status = prerequisite`.
   * Replay = no-op silencieux (0 row affected).
   *
   *   pending → paid       (Authorized)
   *   pending → refused    (Refused/Error/Abandoned/Canceled)
   *   paid    → refunded   (Refunded)
   */
  private async applyStatusTransition(args: {
    payment: HelloAssoPaymentEntity;
    newStatus: HelloAssoPaymentStatus;
    helloAssoPaymentId: number;
    helloAssoOrderId: number | undefined;
  }): Promise<boolean> {
    const { payment, newStatus, helloAssoPaymentId, helloAssoOrderId } = args;

    const prerequisiteStatus =
      newStatus === HelloAssoPaymentStatus.REFUNDED
        ? HelloAssoPaymentStatus.PAID
        : HelloAssoPaymentStatus.PENDING;

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
