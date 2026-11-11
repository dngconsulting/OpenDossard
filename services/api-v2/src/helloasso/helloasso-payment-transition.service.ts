import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { NotificationService, type PushContent } from '../notifications/notification.service';
import {
  HelloAssoPaymentEntity,
  HelloAssoPaymentStatus,
  PaymentStatusSource,
} from './entities/helloasso-payment.entity';
import { prerequisitesForStatus } from './helloasso-state.util';

export type TransitionOutcome = 'updated' | 'noop' | 'conflict';

export interface TransitionInput {
  payment: HelloAssoPaymentEntity;
  newStatus: HelloAssoPaymentStatus;
  statusSource: PaymentStatusSource;
  helloAssoPaymentId?: number;
  helloAssoOrderId?: number;
  helloAssoState?: string | null;
}

/**
 * Transition de statut d'un paiement HelloAsso et notification du payeur.
 *
 * Point d'écriture UNIQUE des trois chemins qui apprennent un résultat de
 * HelloAsso : le webhook, le retour navigateur `/payment/success` et le refresh
 * admin. Quel que soit le premier arrivé, l'UPDATE gardé garantit qu'un seul
 * écrit (`updated`) ; les suivants sont des no-op — d'où l'absence de double
 * push quand le retour navigateur précède le webhook.
 */
@Injectable()
export class HelloAssoPaymentTransitionService {
  private readonly logger = new Logger(HelloAssoPaymentTransitionService.name);

  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * UPDATE atomique idempotent : ne transite que si `status` est dans la liste
   * des pré-requis autorisés pour `newStatus` (cf. `prerequisitesForStatus`).
   * Rejeu ou transition invalide = `noop` (0 row affected).
   *
   * `conflict` : la transition viole `UQ_helloasso_payment_active` — un autre
   * paiement occupe déjà le créneau (competition, licence). Jamais d'exception :
   * le webhook doit répondre 200 et le refresh admin ne doit pas finir en 500.
   */
  async apply(input: TransitionInput): Promise<TransitionOutcome> {
    const { payment, newStatus, helloAssoPaymentId, helloAssoOrderId, helloAssoState } = input;

    const prerequisites = prerequisitesForStatus(newStatus);
    if (prerequisites.length === 0) {
      this.logger.warn(`apply: ignore ${newStatus}, aucun statut pré-requis`);
      return 'noop';
    }

    // Statut et cause dans le MÊME UPDATE : une transition et sa cause ne
    // doivent jamais pouvoir diverger, y compris si le process meurt entre deux
    // écritures.
    const update: Partial<HelloAssoPaymentEntity> = {
      status: newStatus,
      statusSource: input.statusSource,
    };
    if (helloAssoState) {
      update.helloAssoLastState = helloAssoState;
      update.helloAssoLastStateAt = new Date();
    }
    if (typeof helloAssoPaymentId === 'number') {
      update.helloAssoPaymentId = String(helloAssoPaymentId);
    }
    if (typeof helloAssoOrderId === 'number') {
      update.helloAssoOrderId = String(helloAssoOrderId);
    }
    if (newStatus === HelloAssoPaymentStatus.PAID) {
      update.paidAt = new Date();
    }

    try {
      const result = await this.paymentRepo
        .createQueryBuilder()
        .update(HelloAssoPaymentEntity)
        .set(update)
        .where('id = :id AND status IN (:...prerequisites)', {
          id: payment.id,
          prerequisites,
        })
        .execute();
      return (result.affected ?? 0) > 0 ? 'updated' : 'noop';
    } catch (e: unknown) {
      if (!isUniqueViolation(e)) throw e;
      await this.logArbitrationRequired(input);
      return 'conflict';
    }
  }

  /**
   * Notifie le payeur du résultat de son paiement. À appeler UNIQUEMENT après
   * un `apply` qui a renvoyé `updated` (pas de doublon sur rejeu). Jamais
   * throw : un échec FCM est loggé et absorbé.
   */
  async notify(payment: HelloAssoPaymentEntity, newStatus: HelloAssoPaymentStatus): Promise<void> {
    try {
      if (payment.payerUserId == null) return;
      const content = buildPaymentPushContent(payment, newStatus);
      if (!content) return;
      await this.notifications.sendToUser(payment.payerUserId, content);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`notify: échec push paymentId=${payment.id}: ${msg}`);
    }
  }

  /**
   * Seul cas de conflit possible : `refused → paid` alors qu'un autre paiement
   * occupe le créneau. L'argent est engagé sur un paiement qui ne peut pas être
   * marqué payé — seul un humain peut trancher, d'où le ERROR avec la ligne qui
   * bloque (sans elle, l'exploitant doit fouiller la base).
   */
  private async logArbitrationRequired(input: TransitionInput): Promise<void> {
    const { payment, helloAssoPaymentId, helloAssoState, statusSource } = input;
    const blocking = await this.paymentRepo.findOne({
      where: {
        competitionId: payment.competitionId,
        licenceId: payment.licenceId,
        status: In([
          HelloAssoPaymentStatus.PENDING,
          HelloAssoPaymentStatus.PAID,
          HelloAssoPaymentStatus.REFUNDING,
        ]),
      },
    });
    this.logger.error(
      `ARBITRAGE REQUIS — paiement #${payment.id} autorisé chez HelloAsso ` +
        `(state=${helloAssoState ?? '?'}, helloAssoPaymentId=${helloAssoPaymentId ?? '?'}, ` +
        `source=${statusSource}) mais NON enregistré : le créneau ` +
        `(competition=${payment.competitionId}, licence=${payment.licenceId}) est occupé ` +
        `par le paiement #${blocking?.id ?? '?'} (statut ${blocking?.status ?? 'inconnu'}). ` +
        `Argent encaissé sans engagement : rembourser l'un des deux ou rapprocher les lignes.`,
    );
  }
}

/**
 * Contenu de la push selon le statut atteint. `null` = pas de push (statut
 * transitoire `refunding`). Les valeurs `data` sont des strings (contrainte
 * FCM) ; `competitionId` sert au deeplink vers l'épreuve.
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

/**
 * Violation de contrainte d'unicité PostgreSQL (SQLSTATE 23505). TypeORM
 * enveloppe l'erreur du driver mais conserve le `code` du pilote `pg`.
 */
function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: unknown }).code === '23505';
}
