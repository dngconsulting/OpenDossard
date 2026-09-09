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
};

/**
 * États HelloAsso signifiant que le paiement a bel et bien été AUTORISÉ.
 * Les rencontrer sur une ligne `refused` est une anomalie financière.
 */
const AUTHORIZED_STATES = ['Authorized', 'AuthorizedPreprod'];

/**
 * Le cas le plus grave que cette fonction puisse décrire : HelloAsso a autorisé
 * le paiement, mais la ligne est restée `refused` parce qu'un autre engagement
 * occupe le créneau de `UQ_helloasso_payment_active` et que PostgreSQL a refusé
 * la transition. L'argent est encaissé, le coureur n'est pas inscrit, et rien ne
 * se résoudra tout seul.
 */
const AUTHORIZED_BUT_REFUSED: PaymentStatusDescription = {
  statusDetail:
    'Payé chez HelloAsso mais non enregistré — un autre engagement occupe la place, arbitrage requis',
  statusSeverity: 'error',
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
      // Prime sur TOUT, y compris la source OD : savoir que le coureur avait
      // annulé n'a plus aucune importance devant le fait qu'il a payé.
      if (payment.helloAssoLastState && AUTHORIZED_STATES.includes(payment.helloAssoLastState)) {
        return AUTHORIZED_BUT_REFUSED;
      }

      const bySource = payment.statusSource ? BY_SOURCE[payment.statusSource] : undefined;
      const byState = payment.helloAssoLastState
        ? BY_HELLOASSO_STATE[payment.helloAssoLastState]
        : undefined;

      if (!bySource) return byState ?? LEGACY;

      // Les deux causes coexistent : OpenDossard a pris une décision (remplacé,
      // annulé, expiré) ET HelloAsso a fini par se prononcer sur la tentative.
      // Faire primer la source OD SANS montrer l'autre masquerait un vrai refus
      // bancaire derrière un « Remplacé » — l'inverse de ce que cette fonction
      // existe pour rendre lisible.
      //
      // La gravité reste celle de la décision OD : ce n'est pas cette ligne qui
      // a échoué, elle a été remplacée ou expirée. La colorer en rouge ferait
      // croire aux organisateurs à des échecs de paiement qui n'existent pas.
      if (byState) {
        const cause = byState.statusDetail ?? '';
        return {
          statusDetail: `${bySource.statusDetail} — HelloAsso a ensuite signalé : ${
            cause.charAt(0).toLowerCase() + cause.slice(1)
          }`,
          statusSeverity: bySource.statusSeverity,
        };
      }

      // Sans état HelloAsso exploitable, la décision OD est la seule information
      // disponible — c'est le cas courant : `user_cancel` et `superseded` ne
      // produisent aucun événement HelloAsso.
      return bySource;
    }

    default:
      return LEGACY;
  }
}
