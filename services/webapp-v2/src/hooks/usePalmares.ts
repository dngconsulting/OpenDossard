import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { palmaresApi } from '@/api/palmares.api';

export const palmaresKeys = {
  all: ['palmares'] as const,
  detail: (id: string) => ['palmares', id] as const,
  search: (query: string) => ['licences', 'search', query] as const,
};

export function usePalmares(licenceId: string | undefined) {
  return useQuery({
    queryKey: palmaresKeys.detail(licenceId || ''),
    queryFn: () => palmaresApi.getPalmares(licenceId!),
    enabled: !!licenceId,
  });
}

export function useLicenceSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: palmaresKeys.search(debouncedQuery),
    queryFn: () => palmaresApi.searchLicences(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });
}

export function useFilteredResults(
  results: { competitionType: string }[] | undefined,
  type: 'ROUTE' | 'CX'
) {
  if (!results) {
    return [];
  }
  return results.filter(r => r.competitionType === type);
}
