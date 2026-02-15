import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { racesApi } from '@/api/races.api';
import type { CreateEngagementDto, UpdateRankingDto, RemoveRankingDto, ReorderRankingItemDto } from '@/types/races';

export const racesKeys = {
  competition: (competitionId: number) => ['races', 'competition', competitionId] as const,
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

/**
 * Hook pour uploader un fichier CSV de résultats
 */
export function useUploadResultsCsv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      file,
    }: {
      competitionId: number;
      file: File;
    }) => racesApi.uploadResultsCsv(competitionId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

