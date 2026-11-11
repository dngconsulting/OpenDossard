import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
  PaymentStatusSource,
} from './entities/helloasso-payment.entity';
import { HelloAssoPaymentService } from './helloasso-payment.service';
import { HelloAssoPaymentTransitionService } from './helloasso-payment-transition.service';
import { findLatestMappedPayment, mapHelloAssoState } from './helloasso-state.util';

/**
 * Confirmation d'un paiement au retour navigateur `/payment/success`, sans
 * attendre le webhook HelloAsso (qui peut arriver plusieurs minutes après).
 *
 * Pourquoi : tant que la ligne reste `pending`, l'app peut l'annuler (fermeture
 * du navigateur sans deep link) ou une relance peut la remplacer — alors que
 * HelloAsso a déjà encaissé. Résultat : double paiement (incident du 10/11/2026,
 * paiements #1413/#1414).
 *
 * L'URL de retour est publique et non signée : ses paramètres servent
 * UNIQUEMENT à retrouver la ligne. Seul HelloAsso, interrogé avec notre token
 * partenaire sur l'intent stocké en base, décide du passage en `paid`.
 *
 * Un seul appel HelloAsso, sans relance : si l'intent n'est pas encore
 * `Authorized`, on n'écrit rien et le webhook prend le relais comme avant.
 */
@Injectable()
export class HelloAssoPaymentReturnService {
  private readonly logger = new Logger(HelloAssoPaymentReturnService.name);

  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
    private readonly payments: HelloAssoPaymentService,
    private readonly transitions: HelloAssoPaymentTransitionService,
  ) {}

  /**
   * Jamais throw : appelé sans `await` après la redirection, une erreur non
   * absorbée deviendrait une unhandled rejection.
   */
  async confirmFromReturnUrl(rawPaymentId: unknown, rawIntentId: unknown): Promise<void> {
    try {
      await this.confirm(rawPaymentId, rawIntentId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`confirmFromReturnUrl: paymentId=${String(rawPaymentId)} échec : ${msg}`);
    }
  }

  private async confirm(rawPaymentId: unknown, rawIntentId: unknown): Promise<void> {
    const paymentId = typeof rawPaymentId === 'string' ? Number(rawPaymentId) : NaN;
    if (!Number.isInteger(paymentId) || paymentId <= 0 || typeof rawIntentId !== 'string') {
      return;
    }

    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    // L'intent reçu doit être celui de la ligne : empêche de viser une ligne
    // avec l'intent (payé) d'une autre.
    if (!payment || payment.helloAssoCheckoutIntentId !== rawIntentId) {
      this.logger.warn(
        `confirmFromReturnUrl: paramètres incohérents paymentId=${paymentId} intent=${rawIntentId}, ignoré`,
      );
      return;
    }
    // Déjà payé (webhook arrivé avant, ou URL rejouée) : aucun appel HelloAsso.
    if (payment.status === HelloAssoPaymentStatus.PAID) return;

    // Même lecture et même règle de sélection que le refresh admin : on ne
    // passe en `paid` que si le paiement HelloAsso qui fait foi est autorisé.
    const intent = await this.payments.fetchCheckoutIntent(payment);
    const authorized = findLatestMappedPayment(intent);
    if (!authorized || mapHelloAssoState(authorized.state) !== HelloAssoPaymentStatus.PAID) {
      this.logger.log(
        `confirmFromReturnUrl: paymentId=${payment.id} pas autorisé chez HelloAsso (state=${authorized?.state ?? '<none>'}), le webhook prendra le relais`,
      );
      return;
    }

    const outcome = await this.transitions.apply({
      payment,
      newStatus: HelloAssoPaymentStatus.PAID,
      statusSource: PaymentStatusSource.RETURN_URL,
      helloAssoPaymentId: typeof authorized.id === 'number' ? authorized.id : undefined,
      helloAssoOrderId: typeof intent.order?.id === 'number' ? intent.order.id : undefined,
      helloAssoState: authorized.state ?? null,
    });
    this.logger.log(
      `confirmFromReturnUrl: paymentId=${payment.id} ${payment.status}→paid outcome=${outcome}`,
    );
    if (outcome === 'updated') {
      await this.transitions.notify(payment, HelloAssoPaymentStatus.PAID);
    }
  }
}
