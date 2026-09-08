import { HelloAssoPaymentStatus, PaymentStatusSource } from './entities/helloasso-payment.entity';

/**
 * Gravité SÉMANTIQUE d'un statut — pas une couleur. Chaque client fait sa propre
 * correspondance vers sa palette, mais la classification, elle, reste unique :
 * la dupliquer dans le back-office et dans DossardeurV2 garantirait qu'ils
 * divergent au premier ajout de cause.
 *
 *  - `error`   : le paiement a réellement échoué, il y a quelque chose à traiter
 *  - `neutral` : acte volontaire du coureur, aucun problème
 *  - `muted`   : non-événement (remplacé, expiré, jamais finalisé)
 */
export type PaymentStatusSeverity = 'success' | 'info' | 'error' | 'neutral' | 'muted';

export interface PaymentStatusDescription {
  /** Phrase discriminante, `null` quand le statut se suffit à lui-même. */
  statusDetail: string | null;
  statusSeverity: PaymentStatusSeverity;
}

const LEGACY: PaymentStatusDescription = {
  statusDetail: 'Cause inconnue (paiement antérieur au suivi détaillé)',
  statusSeverity: 'error',
};

/** Causes portées par OpenDossard : aucun événement HelloAsso ne les accompagne. */
const BY_SOURCE: Partial<Record<PaymentStatusSource, PaymentStatusDescription>> = {
  [PaymentStatusSource.USER_CANCEL]: {
    statusDetail: 'Annulé par le coureur',
    statusSeverity: 'neutral',
  },
  [PaymentStatusSource.SUPERSEDED]: {
    statusDetail: 'Remplacé par une nouvelle tentative de paiement',
    statusSeverity: 'muted',
  },
  [PaymentStatusSource.EXPIRED]: {
    statusDetail: 'Expiré — paiement non finalisé dans les 15 minutes',
    statusSeverity: 'muted',
  },
};

/** Causes portées par HelloAsso, lues sur l'état brut. */
const BY_HELLOASSO_STATE: Record<string, PaymentStatusDescription> = {
  Refused: { statusDetail: 'Refusé par la banque', statusSeverity: 'error' },
  Error: { statusDetail: 'Échec technique côté HelloAsso', statusSeverity: 'error' },
  Canceled: { statusDetail: 'Annulé côté HelloAsso', statusSeverity: 'error' },
  Abandoned: {
    statusDetail: 'Tunnel de paiement quitté avant la fin',
    statusSeverity: 'muted',
  },
};

export interface DescribablePayment {
  status: HelloAssoPaymentStatus;
  helloAssoLastState: string | null;
  statusSource: PaymentStatusSource | null;
}

/**
 * Traduit un paiement en phrase affichable + gravité sémantique.
 *
 * Le statut `refused` d'OpenDossard agrège six causes que rien ne distinguait
 * jusqu'ici : refus bancaire, erreur technique, abandon du tunnel, annulation
 * côté HelloAsso, annulation par le coureur, et remplacement par une nouvelle
 * tentative. Les deux dernières ne produisent aucun événement HelloAsso — d'où
 * la lecture croisée de `statusSource` ET `helloAssoLastState`.
 *
 * Le mapping `PaymentState` → `HelloAssoPaymentStatus` n'est PAS touché : cette
 * fonction ne fait que restituer une information jusqu'ici perdue.
 */
export function describePaymentStatus(payment: DescribablePayment): PaymentStatusDescription {
  switch (payment.status) {
    case HelloAssoPaymentStatus.PAID:
      return { statusDetail: null, statusSeverity: 'success' };

    case HelloAssoPaymentStatus.REFUNDING:
    case HelloAssoPaymentStatus.REFUNDED:
      return { statusDetail: null, statusSeverity: 'info' };

    case HelloAssoPaymentStatus.PENDING:
      return payment.helloAssoLastState === 'WaitingAuthentication'
        ? {
            statusDetail: 'Authentification bancaire (3-D Secure) en cours',
            statusSeverity: 'info',
          }
        : {
            statusDetail: 'Paiement en cours, en attente de confirmation',
            statusSeverity: 'info',
          };

    case HelloAssoPaymentStatus.REFUSED: {
      // La cause OD prime : le job d'expiration interroge HelloAsso avant
      // d'expirer, la ligne peut donc porter un état résiduel (`Pending`…) alors
      // que la décision vient bien d'OpenDossard.
      const bySource = payment.statusSource ? BY_SOURCE[payment.statusSource] : undefined;
      if (bySource) return bySource;

      const byState = payment.helloAssoLastState
        ? BY_HELLOASSO_STATE[payment.helloAssoLastState]
        : undefined;
      return byState ?? LEGACY;
    }

    default:
      return LEGACY;
  }
}
