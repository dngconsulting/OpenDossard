import { AlertCircle, ExternalLink } from 'lucide-react';

import type { HelloAssoLinkStatusDto } from '@/api/helloasso.api';
import { Button } from '@/components/ui/button';

/**
 * Bandeaux d'état de la liaison HelloAsso d'un club, réutilisables là où l'on
 * veut rappeler l'état de la liaison sans les actions propres à la fiche club
 * (Délier / Lier). Utilisé dans l'encart « Paiement en ligne » de la fiche
 * épreuve (`HelloAssoOnlinePaymentSection`) ; reproduit fidèlement les encarts
 * de la fiche club (`ClubDetailPage`) pour un visuel/libellé identique.
 *
 * Rendu (si le club est lié) :
 *  - Rouge « Afin de pouvoir collecter… » quand l'encaissement HelloAsso est
 *    bloqué (`isCashInCompliant === false`, compte non vérifié). `null` =
 *    inconnu → rien (différent de `false`).
 *  - Liaison : rouge si expirée (refresh token > 30j), sinon ambre avec
 *    « Connecté le X. Renouvellement nécessaire avant le Y. ».
 *
 * Ne rend rien si le club n'est pas lié.
 */

const RED_BANNER =
  'flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200';
const AMBER_BANNER =
  'flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200';

type HelloAssoStatusNoticesProps = {
  status: HelloAssoLinkStatusDto | undefined;
  /** Classes appliquées au conteneur (ex: `mt-2`). */
  className?: string;
};

export function HelloAssoStatusNotices({ status, className }: HelloAssoStatusNoticesProps) {
  if (!status?.linked) {
    return null;
  }

  const { slug } = status;
  const linkedAtDate = new Date(status.linkedAt).toLocaleDateString('fr-FR');
  const refreshExpiresDate = new Date(status.refreshTokenExpiresAt).toLocaleDateString('fr-FR');
  const isExpired = status.expired === true;
  const isCashInBlocked = status.isCashInCompliant === false;

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      {isCashInBlocked && (
        <div className={RED_BANNER}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-3">
            <p>
              Afin de pouvoir collecter des paiements en ligne, vous devez vérifier le compte
              HelloAsso de votre association en envoyant le dossier de vérification sur la
              plateforme. Tant que cette étape n&apos;est pas validée, vous ne pourrez encaisser
              aucun paiement en ligne.
            </p>
            {slug && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={`https://admin.helloasso.com/${slug}/verification`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Vérifier mon compte HelloAsso
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={isExpired ? RED_BANNER : AMBER_BANNER}>
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
              Connecté le <strong>{linkedAtDate}</strong>. Renouvellement nécessaire avant le{' '}
              <strong>{refreshExpiresDate}</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
