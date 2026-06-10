import { useMutation, useQuery } from '@tanstack/react-query';

import { competitionPushApi } from '@/api/competition-push.api';

export const competitionPushKeys = {
  targets: (competitionId: number) => ['competition-push', 'targets', competitionId] as const,
};

/**
 * Nombre d'abonnés (starreurs) qui seraient notifiés. Fetché uniquement quand
 * `enabled` (= à l'ouverture de l'étape de confirmation) et jamais mis en
 * cache (`gcTime: 0`) : le compte doit être frais à chaque confirmation.
 */
export function usePushTargets(competitionId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: competitionPushKeys.targets(competitionId!),
    queryFn: () => competitionPushApi.getTargets(competitionId!),
    enabled: enabled && competitionId != null,
    staleTime: 0,
    gcTime: 0,
  });
}

/** Envoi du push aux abonnés de l'épreuve. */
export function useSendCompetitionPush() {
  return useMutation({
    mutationFn: ({ competitionId, message }: { competitionId: number; message: string }) =>
      competitionPushApi.send(competitionId, message),
  });
}
