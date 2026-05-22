import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

const REASON_LABEL: Record<string, string> = {
  no_matching_club: "Aucun club ne correspond à l'association HelloAsso",
  access_denied: 'Autorisation refusée côté HelloAsso',
  exchange_failed: 'Échange du code OAuth échoué',
  missing_params: 'Paramètres OAuth manquants',
  missing_origin_club:
    "Aucun club d'origine n'est associé à cette autorisation — relancez la liaison depuis la fiche du club concerné",
  origin_club_not_found: "Le club d'origine n'existe plus en base",
  invalid_request:
    'Requête invalide — configuration HelloAsso à vérifier (contacter un administrateur)',
};

const HELLOASSO_QUERY_KEYS = [
  'status',
  'reason',
  'clubId',
  'slug',
  'originClubHasSlug',
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

    // Snapshot des params AVANT le defer (searchParams sera nettoyé juste
    // après par setSearchParams ci-dessous, le setTimeout les lirait à null).
    const reason = searchParams.get('reason') ?? 'inconnue';
    const slug = searchParams.get('slug') ?? '';
    const originClubHasSlug = searchParams.get('originClubHasSlug');
    const errorDescription = searchParams.get('error_description') ?? undefined;
    const errorUri = searchParams.get('error_uri') ?? undefined;

    if (status === 'error') {
      // Dump le détail OAuth2 brut en console pour diagnostic (`error_description`
      // /`error_uri` viennent directement d'HelloAsso, propagés par le backend).
      console.error('[HelloAsso callback] error details', {
        reason,
        slug,
        originClubHasSlug,
        error_description: errorDescription,
        error_uri: errorUri,
      });
    }

    // Defer du `showXxxToast` au tick suivant : ce hook est monté sous
    // `<BrowserRouter>` (dans <HelloAssoLandingHandler />), alors que le
    // `<Toaster>` Sonner est sibling de `<BrowserRouter>` plus haut dans
    // l'arbre. Les `useEffect` tournent enfant-first, donc le nôtre tire
    // AVANT que le Toaster se soit abonné à son store interne. Un appel
    // `toast.custom(...)` synchrone est alors perdu (aucun listener).
    // Avec `setTimeout(0)`, l'appel est repoussé après tous les effects du
    // commit initial, donc le Toaster est prêt à recevoir.
    // `id` stable : Sonner dédup → en StrictMode dev l'effet joue deux fois,
    // sans id on aurait deux toasts empilés. Avec id, le second appel met
    // simplement à jour l'existant (même contenu → invisible pour l'user).
    const toastId = 'helloasso-landing';
    const timer = setTimeout(() => {
      if (status === 'success') {
        showSuccessToast('Compte HelloAsso lié', slug ? `Association : ${slug}` : undefined, {
          id: toastId,
        });
      } else if (status === 'error') {
        if (reason === 'no_matching_club') {
          // Deux sous-cas distingués par `originClubHasSlug` (propagé par le
          // backend) : le champ HelloAsso slug du club d'origine est vide OU
          // il est rempli mais ne matche pas le slug retourné par HelloAsso.
          // Dans les deux cas, c'est un ADMIN/ORGA du club qui doit corriger
          // le champ "HelloAsso slug" sur la fiche, plus un "contacter l'admin".
          const slugLabel = slug || 'inconnu';
          const detail =
            originClubHasSlug === 'false'
              ? `HelloAsso a retourné l'association « ${slugLabel} ». Renseignez ce slug exact dans le champ « HelloAsso slug » de la fiche club, puis relancez la liaison.`
              : `Le slug retourné par HelloAsso (« ${slugLabel} ») ne correspond pas à celui enregistré sur ce club. Vérifiez et corrigez le champ « HelloAsso slug » de la fiche club, puis relancez la liaison.`;
          showErrorToast('Liaison HelloAsso échouée', detail, { id: toastId });
        } else {
          const label = REASON_LABEL[reason] ?? reason;
          const detail = errorDescription ? `${label} — ${errorDescription}` : label;
          showErrorToast('Liaison HelloAsso échouée', detail, { id: toastId });
        }
      }
    }, 0);

    const next = new URLSearchParams(searchParams);
    HELLOASSO_QUERY_KEYS.forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
    // Pas de boucle infinie : on supprime `status` (la clé déclenchante) avant
    // setSearchParams → au re-run, l'early-return en haut quitte tout de suite.
    //
    // Pas de cleanup du timer : si le composant est démonté entre le schedule
    // et le tick (cas rare ; ce composant reste monté toute la durée de
    // l'app), `toast.custom` peut être appelé même sans React monté — Sonner
    // est un singleton global. Cleanup ici annulerait au contraire le toast
    // en StrictMode (le 1er cleanup tuerait le timer scheduled par le 2e run).
    void timer;
  }, [searchParams, setSearchParams]);
}
