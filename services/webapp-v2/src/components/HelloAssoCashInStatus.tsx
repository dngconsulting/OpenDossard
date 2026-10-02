import { AlertCircle, CheckCircle2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useRefreshCashInCompliance } from '@/hooks/useHelloAssoAuth';

const GREEN_BANNER =
  'flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200';
const RED_BANNER =
  'flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200';

type HelloAssoCashInStatusProps = {
  /** Club lié. Sans lui, le bandeau s'affiche sans bouton de rafraîchissement. */
  clubId?: number;
  slug: string;
  /** Drapeau `isCashInCompliant` stocké (`null` = inconnu). */
  isCashInCompliant: boolean | null;
};

/**
 * Statut de vérification du compte HelloAsso du club, avec le bouton
 * « Rafraîchir le statut » : le drapeau n'est relu chez HelloAsso qu'à la
 * liaison, l'admin ou l'organisateur le relance après ses démarches.
 *
 *  - vérifié (`true`) → vert, le paiement en ligne peut être activé ;
 *  - non vérifié (`false`) → rouge, aucun paiement ne peut être encaissé ; lien
 *    vers la vérification HelloAsso ;
 *  - inconnu (`null`) → rouge aussi : le paiement en ligne ne peut pas être
 *    activé tant que le statut n'a pas été rafraîchi.
 *
 * Seul encart sur la conformité : il remplace l'ancien bandeau rouge « Afin de
 * pouvoir collecter… », qui faisait doublon.
 */
export function HelloAssoCashInStatus({ clubId, slug, isCashInCompliant }: HelloAssoCashInStatusProps) {
  const isVerified = isCashInCompliant === true;

  return (
    <div className={isVerified ? GREEN_BANNER : RED_BANNER}>
      {isVerified ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="space-y-3">
        <p>
          {isVerified
            ? 'Compte HelloAsso vérifié : le club peut encaisser des paiements en ligne.'
            : isCashInCompliant === false
              ? 'Compte HelloAsso non vérifié : aucun paiement en ligne ne peut être encaissé ni activé tant que HelloAsso n’a pas validé le dossier de vérification de l’association.'
              : 'Statut de vérification du compte HelloAsso inconnu : rafraîchissez-le avant d’activer le paiement en ligne.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {isCashInCompliant === false && (
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
          {clubId != null && <RefreshButton clubId={clubId} />}
        </div>
      </div>
    </div>
  );
}

function RefreshButton({ clubId }: { clubId: number }) {
  const mutation = useRefreshCashInCompliance(clubId);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Rafraîchir le statut
    </Button>
  );
}
