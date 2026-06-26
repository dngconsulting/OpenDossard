import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
} from './entities/helloasso-payment.entity';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoWebhookKeysService } from './helloasso-webhook-keys.service';
import { mapHelloAssoState, prerequisitesForStatus } from './helloasso-state.util';
import { verifyHelloAssoSignature } from './util/webhook-signature.util';
import { NotificationService, type PushContent } from '../notifications/notification.service';

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
    /** Présent sur l'event `Organization.IsCashinCompliant` (snake_case côté HA). */
    organization_slug?: unknown;
    /** Présent sur l'event `Organization.IsCashinCompliant` (snake_case côté HA). */
    is_cashin_compliant?: unknown;
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
    private readonly keysProvider: HelloAssoWebhookKeysService,
    private readonly details: HelloAssoDetailsService,
    private readonly notifications: NotificationService,
  ) {}

  private verifySignature(
    rawBody: Buffer | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    return verifyHelloAssoSignature(rawBody, this.keysProvider.getKeys(), headers);
  }

  async handleWebhook(
    rawBody: Buffer | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookResult> {
    if (!this.verifySignature(rawBody, headers)) {
      // Cache vide (HelloAsso injoignable au boot) ou rotation de clé côté HA :
      // on tente un refresh (throttlé) puis on revérifie une seule fois.
      await this.keysProvider.refresh();
      if (!this.verifySignature(rawBody, headers)) {
        this.logger.warn('handleWebhook: signature invalide (après refresh des clés)');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    let parsed: WebhookPayload;
    try {
      parsed = JSON.parse((rawBody as Buffer).toString('utf8')) as WebhookPayload;
      this.logger.log(`handleWebhook: received message from HA ${JSON.stringify(parsed)}`);
    } catch (e: unknown) {
      this.logger.warn(
        `handleWebhook: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
      return { signatureValid: true, outcome: 'invalid_json' };
    }

    const eventType = parsed.eventType;

    // Event `Organization.IsCashinCompliant` : HA notifie un changement
    // d'éligibilité à l'encaissement pour une orga (slug + booléen). Mis à
    // jour en best-effort dans `helloasso_details` ; un slug inconnu côté
    // OpenDossard donne un 200 + no-op (orga liée à un autre partenaire HA
    // mais notifiée à cause de notre souscription partenaire-wide).
    if (eventType === 'Organization.IsCashinCompliant') {
      return this.handleCashinComplianceEvent(parsed);
    }

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
        `handleWebhook: no openDossardPaymentId in metadata, ignoring helloAssoPaymentId=${helloAssoPaymentId} state=${state}`,
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

    // Push notification UNIQUEMENT sur transition réelle (`updated`) — pas de
    // doublon si HelloAsso rejoue le même webhook. Best-effort et isolé : un
    // échec FCM ne doit JAMAIS faire échouer/rejouer le webhook (réponse 200).
    if (updated) {
      await this.notifyPaymentTransition(payment, mappedStatus);
    }

    return {
      signatureValid: true,
      outcome: updated
        ? `transitioned:${payment.status}→${mappedStatus}`
        : `noop_no_transition_from:${payment.status}`,
    };
  }

  /**
   * Notifie le payeur du résultat de son paiement. Cible ses appareils via
   * `payerUserId`. `paid`/`refused`/`refunded` → push ; les états transitoires
   * (`refunding`) ne notifient pas. Jamais throw : tout échec est loggé et
   * absorbé pour ne pas perturber la réponse webhook.
   */
  private async notifyPaymentTransition(
    payment: HelloAssoPaymentEntity,
    newStatus: HelloAssoPaymentStatus,
  ): Promise<void> {
    try {
      if (payment.payerUserId == null) return;
      const content = buildPaymentPushContent(payment, newStatus);
      if (!content) return;
      await this.notifications.sendToUser(payment.payerUserId, content);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`notifyPaymentTransition: échec push paymentId=${payment.id}: ${msg}`);
    }
  }

  /**
   * Traite l'event `Organization.IsCashinCompliant` reçu d'HelloAsso.
   *
   * Payload attendu (snake_case côté HA) :
   *   { eventType: 'Organization.IsCashinCompliant',
   *     data: { organization_slug: '…', is_cashin_compliant: true|false } }
   *
   * Politique de retour : toujours 200 (cf. doc de classe). Un slug inconnu
   * localement n'est PAS une erreur — HelloAsso pousse les events partenaire-wide,
   * donc on peut recevoir des slugs d'orgas qui ne nous concernent pas.
   */
  private async handleCashinComplianceEvent(parsed: WebhookPayload): Promise<WebhookResult> {
    const slug = parsed.data?.organization_slug;
    const value = parsed.data?.is_cashin_compliant;
    if (typeof slug !== 'string' || slug.trim().length === 0 || typeof value !== 'boolean') {
      this.logger.warn(
        `handleCashinComplianceEvent: malformed payload (slug=${String(slug)}, value=${String(value)})`,
      );
      return { signatureValid: true, outcome: 'malformed_cashin_compliance_payload' };
    }

    const affected = await this.details.setIsCashInCompliantBySlug(slug, value);
    if (affected === 0) {
      this.logger.log(
        `handleCashinComplianceEvent: no local link for slug=${slug} — ignoring (foreign organization)`,
      );
      return { signatureValid: true, outcome: `orphan_no_local_link:${slug}` };
    }

    this.logger.log(
      `handleCashinComplianceEvent: slug=${slug} isCashInCompliant=${value} (affected=${affected})`,
    );
    return {
      signatureValid: true,
      outcome: `cashin_compliance_updated:${slug}:${value}`,
    };
  }

  /**
   * UPDATE atomique idempotent : ne transite que si `status` est dans la liste
   * des pré-requis autorisés pour `newStatus` (cf. `prerequisitesForStatus`).
   * Replay ou transition invalide = no-op silencieux (0 row affected).
   */
  private async applyStatusTransition(args: {
    payment: HelloAssoPaymentEntity;
    newStatus: HelloAssoPaymentStatus;
    helloAssoPaymentId: number;
    helloAssoOrderId: number | undefined;
  }): Promise<boolean> {
    const { payment, newStatus, helloAssoPaymentId, helloAssoOrderId } = args;

    const prerequisites = prerequisitesForStatus(newStatus);
    if (prerequisites.length === 0) {
      this.logger.warn(`applyStatusTransition: ignore ${newStatus}, not found in existing states`);
      return false;
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
      .where('id = :id AND status IN (:...prerequisites)', {
        id: payment.id,
        prerequisites,
      })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}

/**
 * Construit le contenu de la push selon le statut atteint. `null` = pas de push
 * (statut transitoire `refunding`). Les valeurs `data` sont des strings
 * (contrainte FCM) ; `competitionId` sert au deeplink vers l'épreuve.
 */
function buildPaymentPushContent(
  payment: HelloAssoPaymentEntity,
  newStatus: HelloAssoPaymentStatus,
): PushContent | null {
  const data: Record<string, string> = {
    type: 'payment',
    competitionId: String(payment.competitionId),
    paymentId: String(payment.id),
    status: newStatus,
  };
  switch (newStatus) {
    case HelloAssoPaymentStatus.PAID:
      return { title: 'Inscription confirmée', body: 'Votre paiement a été enregistré.', data };
    case HelloAssoPaymentStatus.REFUSED:
      return {
        title: 'Paiement annulé ou refusé',
        body: 'Vous pouvez réessayer depuis l’épreuve.',
        data,
      };
    case HelloAssoPaymentStatus.REFUNDED:
      return {
        title: 'Paiement remboursé',
        body: 'Votre inscription a été annulée.',
        data,
      };
    default:
      return null;
  }
}
