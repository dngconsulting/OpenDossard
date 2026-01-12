import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { racesApi } from '@/api/races.api';
import type { RaceType, EngagedRider } from '@/types/races.ts';

export const racesKeys = {
  all: ['races'] as const,
  detail: (id: string) => ['races', id] as const,
};

export function useRaces() {
  return useQuery({
    queryKey: racesKeys.all,
    queryFn: () => racesApi.getAll(),
  });
}

export function useRace(id: string) {
  return useQuery({
    queryKey: racesKeys.detail(id),
    queryFn: () => racesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (race: Omit<RaceType, 'id'>) => racesApi.create(race),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: racesKeys.all });
    },
  });
}

export function useUpdateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RaceType> }) =>
      racesApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: racesKeys.all });
      queryClient.invalidateQueries({
        queryKey: racesKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => racesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: racesKeys.all });
    },
  });
}

export function useAddEngagedRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      raceId: string
      categoryId: string
      rider: Omit<EngagedRider, 'id'>
    }) => racesApi.addEngagedRider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: racesKeys.all });
    }
  });
}

export function useRemoveEngagedRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      raceId: string
      categoryId: string
      riderId: string
    }) => racesApi.removeEngagedRider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: racesKeys.all });
    }
  });
}

export function useUpdateResultsRankings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      raceId: string
      categoryId: string
      resultIds: string[]
    }) => racesApi.updateResultsRankings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: racesKeys.all });
    }
  });
}
