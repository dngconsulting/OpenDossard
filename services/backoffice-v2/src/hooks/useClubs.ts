import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clubsApi } from '@/api/clubs.api';
import type { ClubType } from '@/types/clubs';

export const clubsKeys = {
  all: ['clubs'] as const,
  byDepartment: (department: string) => ['clubs', 'department', department] as const,
  search: (query: string) => ['clubs', 'search', query] as const,
  detail: (id: string) => ['clubs', id] as const,
};

export function useClubs() {
  return useQuery({
    queryKey: clubsKeys.all,
    queryFn: () => clubsApi.getAll(),
  });
}

export function useClubsByDepartment(department: string) {
  return useQuery({
    queryKey: clubsKeys.byDepartment(department),
    queryFn: () => clubsApi.getByDepartment(department),
    enabled: !!department,
  });
}

export function useSearchClubs(query: string) {
  return useQuery({
    queryKey: clubsKeys.search(query),
    queryFn: () => clubsApi.search(query),
    enabled: query.length > 0,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (club: Omit<ClubType, 'id'>) => clubsApi.create(club),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.all });
      if (variables.department) {
        queryClient.invalidateQueries({ queryKey: clubsKeys.byDepartment(variables.department) });
      }
    },
  });
}
