import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clubsApi } from '@/api/clubs.api';
import type { ClubType } from '@/types/clubs';

export const clubsKeys = {
  all: ['clubs'] as const,
  byFedeAndDept: (fede: string, dept: string) => ['clubs', 'fede', fede, 'dept', dept] as const,
  detail: (id: string) => ['clubs', id] as const,
};

export function useClubs() {
  return useQuery({
    queryKey: clubsKeys.all,
    queryFn: () => clubsApi.getAll(),
  });
}

// V1 style: fetch clubs by fede AND dept
export function useClubsByFedeAndDept(fede: string, dept: string) {
  return useQuery({
    queryKey: clubsKeys.byFedeAndDept(fede, dept),
    queryFn: () => clubsApi.getByFedeAndDept(fede, dept),
    enabled: !!fede && !!dept,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (club: Omit<ClubType, 'id'>) => clubsApi.create(club),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.all });
      if (variables.fede && variables.dept) {
        queryClient.invalidateQueries({
          queryKey: clubsKeys.byFedeAndDept(variables.fede, variables.dept),
        });
      }
    },
  });
}
