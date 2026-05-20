import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { helloAssoApi, type HelloAssoLinkStatusDto } from '@/api/helloasso.api';
import { ApiError } from '@/utils/error-handler';

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
