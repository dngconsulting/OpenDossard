import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { racesApi } from '@/api/races.api';
import type { CreateEngagementDto, UpdateRankingDto, RemoveRankingDto, RaceType, EngagedRider, ReorderRankingItemDto } from '@/types/races';

export const racesKeys = {
  all: ['races'] as const,
  competition: (competitionId: number) => ['races', 'competition', competitionId] as const,
  palmares: (licenceId: number) => ['races', 'palmares', licenceId] as const,
};

/**
 * Hook pour récupérer les engagements d'une compétition
 */
export function useCompetitionRaces(competitionId: number | undefined) {
  return useQuery({
    queryKey: racesKeys.competition(competitionId!),
    queryFn: () => racesApi.getByCompetition(competitionId!),
    enabled: !!competitionId,
  });
}

/**
 * Hook pour récupérer le palmarès d'un coureur
 */
export function usePalmaresRaces(licenceId: number | undefined) {
  return useQuery({
    queryKey: racesKeys.palmares(licenceId!),
    queryFn: () => racesApi.getPalmares(licenceId!),
    enabled: !!licenceId,
  });
}

/**
 * Hook pour engager un coureur
 */
export function useEngage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEngagementDto) => racesApi.engage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour supprimer un engagement
 */
export function useDeleteRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; competitionId: number }) =>
      racesApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour mettre à jour le classement
 */
export function useUpdateRanking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRankingDto) => racesApi.updateRanking(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour retirer du classement
 */
export function useRemoveRanking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RemoveRankingDto) => racesApi.removeRanking(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour toggle le sprint challenge
 */
export function useToggleChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; competitionId: number }) =>
      racesApi.toggleChallenge(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour mettre à jour le chrono
 */
export function useUpdateChrono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      chrono,
    }: {
      id: number;
      chrono: string;
      competitionId: number;
    }) => racesApi.updateChrono(id, chrono),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour mettre à jour les tours
 */
export function useUpdateTours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      tours,
    }: {
      id: number;
      tours: number | null;
      competitionId: number;
    }) => racesApi.updateTours(id, tours),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

/**
 * Hook pour réordonner les classements (drag & drop)
 */
export function useReorderRankings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      items,
    }: {
      items: ReorderRankingItemDto[];
      competitionId: number;
    }) => racesApi.reorderRankings(items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

// ============================================================================
// Legacy hooks for backward compatibility with existing components
// These are placeholder implementations that will need real API integration
// ============================================================================

/**
 * Hook pour récupérer la liste des courses (legacy)
 * @deprecated Use useCompetitionRaces instead
 */
export function useRaces() {
  return useQuery<RaceType[]>({
    queryKey: ['races', 'legacy'],
    queryFn: async () => [],
    enabled: false, // Disabled by default - needs real implementation
  });
}

/**
 * Hook pour ajouter un coureur engagé (legacy)
 * @deprecated Use useEngage instead
 */
export function useAddEngagedRider() {
  return useMutation({
    mutationFn: async (_data: { raceId: string; categoryId: string; rider: Omit<EngagedRider, 'id'> }) => {
      console.warn('useAddEngagedRider is deprecated. Use useEngage instead.');
      return {} as EngagedRider;
    },
  });
}

/**
 * Hook pour supprimer un coureur engagé (legacy)
 * @deprecated Use useDeleteRace instead
 */
export function useRemoveEngagedRider() {
  return useMutation({
    mutationFn: async (_data: { raceId: string; categoryId: string; riderId: string }) => {
      console.warn('useRemoveEngagedRider is deprecated. Use useDeleteRace instead.');
    },
  });
}

/**
 * Hook pour mettre à jour les classements (legacy)
 * @deprecated Use useUpdateRanking instead
 */
export function useUpdateResultsRankings() {
  return useMutation({
    mutationFn: async (_data: { raceId: string; categoryId: string; resultIds: string[] }) => {
      console.warn('useUpdateResultsRankings is deprecated. Use useUpdateRanking instead.');
    },
  });
}
