import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

const REASON_LABEL: Record<string, string> = {
  no_matching_club: "Aucun club ne correspond à l'association HelloAsso",
  access_denied: 'Autorisation refusée côté HelloAsso',
  exchange_failed: 'Échange du code OAuth échoué',
  missing_params: 'Paramètres OAuth manquants',
  invalid_request:
    'Requête invalide — configuration HelloAsso à vérifier (contacter un administrateur)',
};

const HELLOASSO_QUERY_KEYS = [
  'status',
  'reason',
  'clubId',
  'slug',
  'error_description',
  'error_uri',
];

/**
 * Détecte un atterrissage post-callback HelloAsso (?status=success|error&...),
 * affiche le toast correspondant puis nettoie les query params de l'URL.
 *
 * Le backend redirige vers `/club/{clubId}?status=success` en succès et vers
 * `/clubs?status=error&reason=...` en erreur — ce hook fonctionne sur les deux
 * routes (et n'importe quelle autre route où l'URL aurait ces params).
 *
 * À monter UNE SEULE FOIS dans l'arbre (ex: <HelloAssoLandingHandler /> dans App).
 */
export function useHelloAssoLanding(): void {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) {
      return;
    }

    if (status === 'success') {
      const slug = searchParams.get('slug') ?? '';
      showSuccessToast('Compte HelloAsso lié', slug ? `Association : ${slug}` : undefined);
    } else if (status === 'error') {
      const reason = searchParams.get('reason') ?? 'inconnue';
      const slug = searchParams.get('slug') ?? '';
      const errorDescription = searchParams.get('error_description') ?? undefined;
      const errorUri = searchParams.get('error_uri') ?? undefined;
      // Dump le détail OAuth2 brut en console pour diagnostic (`error_description`
      // /`error_uri` viennent directement d'HelloAsso, propagés par le backend).
      console.error('[HelloAsso callback] error details', {
        reason,
        slug,
        error_description: errorDescription,
        error_uri: errorUri,
      });
      if (reason === 'no_matching_club') {
        showErrorToast(
          'Liaison HelloAsso échouée',
          `L'association « ${slug || 'inconnue'} » n'existe pas dans la base Open Dossard. Merci de contacter l'administrateur pour l'ajouter.`,
        );
      } else {
        const label = REASON_LABEL[reason] ?? reason;
        const detail = errorDescription ? `${label} — ${errorDescription}` : label;
        showErrorToast('Liaison HelloAsso échouée', detail);
      }
    }

    const next = new URLSearchParams(searchParams);
    HELLOASSO_QUERY_KEYS.forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
    // Pas de boucle infinie : on supprime `status` (la clé déclenchante) avant
    // setSearchParams → au re-run, l'early-return ligne 33 quitte tout de suite.
  }, [searchParams, setSearchParams]);
}
