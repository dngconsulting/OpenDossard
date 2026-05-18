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
  Refunded: HelloAssoPaymentStatus.REFUNDED,
};

export function mapHelloAssoState(
  state: string | undefined | null,
): HelloAssoPaymentStatus | undefined {
  if (!state) return undefined;
  return HELLOASSO_STATE_TO_STATUS_MAP[state];
}
