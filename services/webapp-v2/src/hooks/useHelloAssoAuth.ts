import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { helloAssoApi, type HelloAssoLinkStatusDto } from '@/api/helloasso.api';
import { ApiError } from '@/utils/error-handler';
import { showSuccessToast, showWarningToast } from '@/utils/error-handler/error-handler';

export function useHelloAssoAuth() {
  return useMutation({
    mutationFn: (originClubId: number) => helloAssoApi.authorize(originClubId),
  });
}

export function useHelloAssoStatus(clubId: number | undefined) {
  return useQuery({
    queryKey: ['helloasso', 'status', clubId],
    queryFn: async (): Promise<HelloAssoLinkStatusDto> => {
      if (typeof clubId !== 'number') {
        throw new Error(
          'useHelloAssoStatus: queryFn called without clubId (enabled guard bypassed)',
        );
      }
      try {
        return await helloAssoApi.getStatus(clubId);
      } catch (e: unknown) {
        // 403 = l'utilisateur n'est pas autorisé sur ce club (modèle d'autorisation
        // scopé). On traite ça comme "non lié" pour que la section HelloAsso se
        // masque silencieusement côté UI au lieu de déclencher le toast d'erreur
        // global (`QueryCache.onError`). Le hook est appelé sur des pages
        // (ClubDetailPage, GeneralTab de compet) que tout ORGA peut consulter
        // même sans être lié au club.
        if (e instanceof ApiError && e.status === 403) {
          return { linked: false };
        }
        throw e;
      }
    },
    enabled: typeof clubId === 'number',
    staleTime: 60_000,
  });
}

export function useHelloAssoUnlink(clubId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => helloAssoApi.unlink(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helloasso', 'status', clubId] });
    },
  });
}

/**
 * Relit chez HelloAsso la conformité encaissement du club (bouton « Rafraîchir
 * le statut »). Le statut renvoyé remplace directement le cache de
 * `useHelloAssoStatus` : fiche club et fiche épreuve se mettent à jour sans
 * nouvel appel. Erreurs (409 liaison à refaire, 502 HelloAsso injoignable)
 * affichées par le `MutationCache.onError` global (cf. `App.tsx`).
 */
export function useRefreshCashInCompliance(clubId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => helloAssoApi.refreshCashInCompliance(clubId),
    onSuccess: status => {
      queryClient.setQueryData(['helloasso', 'status', clubId], status);
      if (status.linked && status.isCashInCompliant === true) {
        showSuccessToast('Compte HelloAsso vérifié : le paiement en ligne peut être activé.');
      } else {
        showWarningToast(
          'Compte HelloAsso toujours non vérifié : finalisez les démarches auprès de HelloAsso.',
        );
      }
    },
  });
}
