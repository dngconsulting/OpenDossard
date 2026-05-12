import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { helloAssoApi } from '@/api/helloasso.api';

export function useHelloAssoAuth() {
  return useMutation({
    mutationFn: () => helloAssoApi.authorize(),
  });
}

export function useHelloAssoStatus(clubId: number | undefined) {
  return useQuery({
    queryKey: ['helloasso', 'status', clubId],
    queryFn: () => {
      if (typeof clubId !== 'number') {
        throw new Error('useHelloAssoStatus: queryFn called without clubId (enabled guard bypassed)');
      }
      return helloAssoApi.getStatus(clubId);
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
