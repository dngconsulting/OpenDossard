import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { challengesApi } from '@/api/challenges.api'
import type { ChallengeTableType } from '@/components/data/ChallengeTable'

export const challengesKeys = {
  all: ['challenges'] as const,
  detail: (id: string) => ['challenges', id] as const,
}

export function useChallenges() {
  return useQuery({
    queryKey: challengesKeys.all,
    queryFn: () => challengesApi.getAll(),
  })
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: challengesKeys.detail(id),
    queryFn: () => challengesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (challenge: Omit<ChallengeTableType, 'id'>) =>
      challengesApi.create(challenge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengesKeys.all })
    },
  })
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<ChallengeTableType>
    }) => challengesApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: challengesKeys.all })
      queryClient.invalidateQueries({
        queryKey: challengesKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => challengesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengesKeys.all })
    },
  })
}
