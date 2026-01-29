import { useQuery } from '@tanstack/react-query';

import { challengesApi } from '@/api/challenges.api';
import type { ChallengeRider } from '@/types/challenges';

export const challengesKeys = {
  all: ['challenges'] as const,
  active: ['challenges', 'active'] as const,
  detail: (id: number) => ['challenges', id] as const,
  ranking: (id: number) => ['challenges', id, 'ranking'] as const,
};

// Get all active challenges
export function useChallenges(active?: boolean) {
  return useQuery({
    queryKey: active !== undefined ? challengesKeys.active : challengesKeys.all,
    queryFn: () => challengesApi.getAll(active),
  });
}

// Get a single challenge by ID
export function useChallenge(id: number | undefined) {
  return useQuery({
    queryKey: challengesKeys.detail(id!),
    queryFn: () => challengesApi.getById(id!),
    enabled: id !== undefined,
  });
}

// Get challenge ranking (classement)
export function useChallengeRanking(id: number | undefined) {
  return useQuery({
    queryKey: challengesKeys.ranking(id!),
    queryFn: () => challengesApi.getRanking(id!),
    enabled: id !== undefined,
  });
}

// Helper to filter riders by category and gender
export function filterRiders(
  riders: ChallengeRider[] | undefined,
  category: string | undefined,
  gender: string | undefined
): ChallengeRider[] {
  if (!riders) return [];

  return riders
    .filter(rider => {
      if (category && rider.currentLicenceCatev !== category) return false;
      if (gender && rider.gender !== gender) return false;
      return true;
    })
    .sort((a, b) => (b.ptsAllRaces || 0) - (a.ptsAllRaces || 0));
}
