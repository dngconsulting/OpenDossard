import { useQuery } from '@tanstack/react-query';

import { departmentsApi } from '@/api/departments.api';

export const departmentsKeys = {
  all: ['departments'] as const,
  search: (query: string) => ['departments', 'search', query] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentsKeys.all,
    queryFn: () => departmentsApi.getAll(),
  });
}
