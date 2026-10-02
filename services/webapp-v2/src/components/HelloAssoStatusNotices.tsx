import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { HelloAssoLinkStatusDto } from '@/api/helloasso.api';
import { HelloAssoCashInStatus } from '@/components/HelloAssoCashInStatus';

/**
 * Bandeaux d'état de la liaison HelloAsso d'un club, affichés dans l'encart
 * « Paiement en ligne » de la fiche épreuve (`HelloAssoOnlinePaymentSection`).
 * La fiche club (`ClubDetailPage`) a son propre bandeau de liaison (édition
 * désactivée, Délier) mais partage le bandeau de statut `HelloAssoCashInStatus`.
 *
 * Rendu (si le club est lié) :
 *  - Statut de vérification du compte HelloAsso (`isCashInCompliant`) avec le
 *    bouton « Rafraîchir le statut » (`HelloAssoCashInStatus`).
 *  - Liaison : rouge si expirée (refresh token > 30j), sinon vert (simple notice) avec
 *    « Connecté le X. Renouvellement automatique avant le Y. » (job de refresh des tokens).

 *
 * Ne rend rien si le club n'est pas lié.
 */

const RED_BANNER =
  'flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200';
const GREEN_BANNER =
  'flex items-start gap-3 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200';

type HelloAssoStatusNoticesProps = {
  status: HelloAssoLinkStatusDto | undefined;
  /**
   * Club lié (organisateur). Requis pour le bouton « Rafraîchir le statut » ;
   * la mention « Renouvellement automatique avant le … » devient alors un lien
   * vers la fiche de ce club (`/club/:id`).
   */
  clubId?: number;
  /** Classes appliquées au conteneur (ex: `mt-2`). */
  className?: string;
};

export function HelloAssoStatusNotices({
  status,
  clubId,
  className,
}: HelloAssoStatusNoticesProps) {
  if (!status?.linked) {
    return null;
  }

  const { slug } = status;
  const linkedAtDate = new Date(status.linkedAt).toLocaleDateString('fr-FR');
  const refreshExpiresDate = new Date(status.refreshTokenExpiresAt).toLocaleDateString('fr-FR');
  const isExpired = status.expired === true;

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <HelloAssoCashInStatus
        clubId={clubId}
        slug={slug}
        isCashInCompliant={status.isCashInCompliant}
      />

      <div className={isExpired ? RED_BANNER : GREEN_BANNER}>
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          {isExpired ? (
            <>
              <div>
                <strong>Liaison HelloAsso expirée{slug ? ` (${slug})` : ''}.</strong> Les paiements
                en ligne ne fonctionneront plus tant que la liaison n&apos;est pas renouvelée.
              </div>
              <div className="text-xs">
                Connecté le <strong>{linkedAtDate}</strong>. Refresh token expiré depuis le{' '}
                <strong>{refreshExpiresDate}</strong>.
              </div>
            </>
          ) : (
            <div className="text-xs">
              Connecté le <strong>{linkedAtDate}</strong>.{' '}
              {clubId != null ? (
                <Link
                  to={`/club/${clubId}`}
                  className="underline underline-offset-2 hover:text-green-950 dark:hover:text-green-100"
                >
                  Renouvellement automatique avant le <strong>{refreshExpiresDate}</strong>
                </Link>
              ) : (
                <>
                  Renouvellement automatique avant le <strong>{refreshExpiresDate}</strong>
                </>
              )}
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
