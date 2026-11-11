import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HelloAssoPaymentEntity, PaymentStatusSource } from './entities/helloasso-payment.entity';
import { HelloAssoDetailsService } from './helloasso-details.service';
import { HelloAssoPaymentTransitionService } from './helloasso-payment-transition.service';
import { HelloAssoWebhookKeysService } from './helloasso-webhook-keys.service';
import { mapHelloAssoState, recordHelloAssoState as recordState } from './helloasso-state.util';
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
    /** Opérations de remboursement du paiement (vide hors remboursement). */
    refundOperations?: unknown;
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
 * Idempotence : `HelloAssoPaymentTransitionService.apply` ne UPDATE que si `status = prerequisite`.
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
    private readonly transitions: HelloAssoPaymentTransitionService,
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
    } catch (e: unknown) {
      this.logger.warn(
        `handleWebhook: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
      return { signatureValid: true, outcome: 'invalid_json' };
    }

    const eventType = parsed.eventType;

    // Event `Organization.IsCashinCompliant` : HA notifie un changement
    // d'éligibilité à l'encaissement pour une orga (slug + booléen). Mis à
    // jour en best-effort dans `helloasso_organization` ; un slug inconnu côté
    // OpenDossard donne un 200 + no-op (orga liée à un autre partenaire HA
    // mais notifiée à cause de notre souscription partenaire-wide).
    if (eventType === 'Organization.IsCashinCompliant') {
      return this.handleCashinComplianceEvent(parsed);
    }

    if (eventType !== 'Payment') {
      this.logger.log(`handleWebhook: ignoring eventType=${eventType ?? '<missing>'}`);
      return { signatureValid: true, outcome: `ignored_event_type:${eventType ?? '<missing>'}` };
    }

    // HelloAsso pousse TOUS les paiements des organisations liées à OD (boutique,
    // adhésions, campagnes…) : seuls nos checkout-intents portent
    // `metadata.openDossardPaymentId`. Exception : le webhook de remboursement
    // d'un paiement OD arrive SANS cette metadata — il est rattaché plus bas via
    // `data.id`. Tout autre paiement sans metadata sort ici, sans log ni accès
    // base : une campagne de club peut en envoyer des centaines d'un coup, et
    // leurs payloads portent les données personnelles de payeurs étrangers à OD.
    const openDossardPaymentId = parsed.metadata?.openDossardPaymentId;
    const hasOpenDossardMetadata = typeof openDossardPaymentId === 'number';
    if (!hasOpenDossardMetadata && !isRefundNotification(parsed.data)) {
      return { signatureValid: true, outcome: 'foreign_payment' };
    }

    const helloAssoPaymentId = parsed.data?.id;
    const state = parsed.data?.state;
    const orderId = parsed.data?.order?.id;

    if (typeof helloAssoPaymentId !== 'number' || typeof state !== 'string') {
      this.logger.warn('handleWebhook: malformed payload (missing data.id or data.state)');
      return { signatureValid: true, outcome: 'malformed_payload' };
    }

    // La souscription HelloAsso est partenaire-wide : on reçoit des événements
    // d'organisations liées à d'autres partenaires (cf. handleCashinComplianceEvent).
    // On vérifie donc l'existence du paiement AVANT toute écriture — un
    // `openDossardPaymentId` étranger écraserait sinon l'observabilité d'un
    // paiement sans rapport, c'est-à-dire précisément le champ que le support
    // doit pouvoir croire.
    const payment = hasOpenDossardMetadata
      ? await this.paymentRepo.findOne({ where: { id: openDossardPaymentId } })
      : await this.paymentRepo.findOne({
          where: { helloAssoPaymentId: String(helloAssoPaymentId) },
        });
    if (!payment) {
      if (!hasOpenDossardMetadata) {
        // Remboursement d'un paiement étranger à OD… ou d'un paiement OD qu'on
        // n'a pas su rattacher : seule trace permettant de détecter ce raté.
        // Identifiants techniques uniquement, jamais le payeur.
        this.logger.log(
          `handleWebhook: remboursement sans paiement OD correspondant, ignoré helloAssoPaymentId=${helloAssoPaymentId} orderId=${String(orderId)} state=${state}`,
        );
        return { signatureValid: true, outcome: 'foreign_payment' };
      }
      this.logger.warn(
        `handleWebhook: paymentId=${openDossardPaymentId} introuvable (orphan), returning 200`,
      );
      return { signatureValid: true, outcome: 'orphan_no_local_payment' };
    }

    this.logger.log(
      `handleWebhook: paymentId=${payment.id} helloAssoPaymentId=${helloAssoPaymentId} state=${state}`,
    );

    const mappedStatus = mapHelloAssoState(state);
    if (!mappedStatus) {
      // État ignoré par le mapping (`Pending`, `WaitingAuthentication`,
      // `Registered`…) : aucune transition, mais c'est précisément ce que le
      // support cherche devant un paiement figé. On ne trace QUE sur ce chemin —
      // les états mappés voient leur trace écrite par `transitions.apply`,
      // dans le même UPDATE que le statut.
      await recordState(this.paymentRepo, this.logger, payment.id, state);
      this.logger.log(`handleWebhook: state=${state} maps to no-op`);
      return { signatureValid: true, outcome: `noop_state:${state}` };
    }

    const transition = await this.transitions.apply({
      payment,
      newStatus: mappedStatus,
      statusSource: PaymentStatusSource.HELLOASSO_WEBHOOK,
      helloAssoPaymentId,
      helloAssoOrderId: typeof orderId === 'number' ? orderId : undefined,
      helloAssoState: state,
    });
    const updated = transition === 'updated';

    // Transition refusée (rejeu, ou transition non autorisée depuis l'état
    // courant) : aucun UPDATE n'a eu lieu, or HelloAsso vient bel et bien de
    // parler. On retombe sur la trace seule pour ne pas perdre l'information.
    if (!updated) {
      await recordState(this.paymentRepo, this.logger, payment.id, state);
    }

    this.logger.log(
      `handleWebhook: paymentId=${payment.id} ${payment.status}→${mappedStatus} updated=${updated}`,
    );

    // Push notification UNIQUEMENT sur transition réelle (`updated`) — pas de
    // doublon si HelloAsso rejoue le même webhook. Best-effort et isolé : un
    // échec FCM ne doit JAMAIS faire échouer/rejouer le webhook (réponse 200).
    if (updated) {
      await this.transitions.notify(payment, mappedStatus);
    }

    return {
      signatureValid: true,
      outcome: updated
        ? `transitioned:${payment.status}→${mappedStatus}`
        : transition === 'conflict'
          ? `conflict_active_payment_exists:${payment.status}`
          : `noop_no_transition_from:${payment.status}`,
    };
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
}

/**
 * Webhook de remboursement HelloAsso : `state=Refunded` (remboursement
 * effectué), ou opérations de remboursement présentes sur un paiement resté
 * `Authorized` (remboursement échoué).
 */
function isRefundNotification(data: WebhookPayload['data']): boolean {
  if (data?.state === 'Refunded') return true;
  return Array.isArray(data?.refundOperations) && data.refundOperations.length > 0;
}
