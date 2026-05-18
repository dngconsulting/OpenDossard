import { HelloAssoPaymentStatus } from './entities/helloasso-payment.entity';

/**
 * Mapping `PaymentState` HelloAsso → statuts internes OpenDossard.
 *
 * Source de vérité unique partagée par :
 *   - le receiver webhook (`helloasso-webhook.service.ts`)
 *   - l'action refresh admin (`helloasso-payment.service.ts::refreshStatusFromHelloAsso`)
 *
 * Tous les états non listés (Pending, Waiting*, Registered, etc.) → `undefined`,
 * traités comme un no-op silencieux par les deux consommateurs.
 */
export const HELLOASSO_STATE_TO_STATUS_MAP: Record<string, HelloAssoPaymentStatus | undefined> = {
  Authorized: HelloAssoPaymentStatus.PAID,
  AuthorizedPreprod: HelloAssoPaymentStatus.PAID,
  Refused: HelloAssoPaymentStatus.REFUSED,
  Error: HelloAssoPaymentStatus.REFUSED,
  Abandoned: HelloAssoPaymentStatus.REFUSED,
  Canceled: HelloAssoPaymentStatus.REFUSED,
  Refunding: HelloAssoPaymentStatus.REFUNDING,
  Refunded: HelloAssoPaymentStatus.REFUNDED,
};

export function mapHelloAssoState(
  state: string | undefined | null,
): HelloAssoPaymentStatus | undefined {
  if (!state) return undefined;
  return HELLOASSO_STATE_TO_STATUS_MAP[state];
}

/**
 * Statuts pré-requis autorisés pour transiter vers `newStatus`. Utilisé par
 * `applyStatusTransition` (webhook + payment service) pour construire un
 * `WHERE status IN (...)` qui rend l'UPDATE atomique et idempotent.
 *
 * Transitions valides :
 *   pending    → paid | refused           (résultat du checkout)
 *   paid       → refunding | refunded     (HelloAsso peut aussi sauter `refunding`
 *                                          si le refund est instantané)
 *   refunding  → refunded                 (fin du processus de remboursement)
 *
 * Une transition non listée → no-op DB (0 rows affected), traitée comme
 * `confirmed` côté refresh ou ignorée côté webhook.
 */
export function prerequisitesForStatus(
  newStatus: HelloAssoPaymentStatus,
): HelloAssoPaymentStatus[] {
  switch (newStatus) {
    case HelloAssoPaymentStatus.PAID:
    case HelloAssoPaymentStatus.REFUSED:
      return [HelloAssoPaymentStatus.PENDING];
    case HelloAssoPaymentStatus.REFUNDING:
      return [HelloAssoPaymentStatus.PAID];
    case HelloAssoPaymentStatus.REFUNDED:
      return [HelloAssoPaymentStatus.PAID, HelloAssoPaymentStatus.REFUNDING];
    default:
      return [];
  }
}
