import { AlertCircle, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Bandeau rouge « Afin de pouvoir collecter… » : le compte HelloAsso du club
 * n'est pas vérifié, aucun paiement en ligne ne peut être encaissé.
 *
 * N'est plus affiché en permanence : seulement dans l'encart « Paiement en
 * ligne » d'une épreuve dont le switch est à ON alors que le club n'est pas
 * conforme (épreuve activée avant le verrou d'activation).
 */
export function HelloAssoCashInBlockedNotice({ slug }: { slug?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-3">
        <p>
          Afin de pouvoir collecter des paiements en ligne, vous devez vérifier le compte HelloAsso
          de votre association en envoyant le dossier de vérification sur la plateforme. Tant que
          cette étape n&apos;est pas validée, vous ne pourrez encaisser aucun paiement en ligne.
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
  );
}
