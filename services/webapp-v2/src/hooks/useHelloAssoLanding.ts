import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

const REASON_LABEL: Record<string, string> = {
  no_matching_club: "Aucun club ne correspond à l'association HelloAsso",
  access_denied: 'Autorisation refusée côté HelloAsso',
  exchange_failed: 'Échange du code OAuth échoué',
  missing_params: 'Paramètres OAuth manquants',
};

const HELLOASSO_QUERY_KEYS = ['status', 'reason', 'clubId', 'slug'];

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
      showErrorToast('Liaison HelloAsso échouée', REASON_LABEL[reason] ?? reason);
    }

    const next = new URLSearchParams(searchParams);
    HELLOASSO_QUERY_KEYS.forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
