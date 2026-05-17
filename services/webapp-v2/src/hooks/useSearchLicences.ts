import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { licencesApi } from '@/api/licences.api';
import type { LicenceType } from '@/types/licences';

export const searchLicencesKeys = {
  search: (query: string, competitionId?: number) =>
    ['licences', 'search', query, competitionId ?? null] as const,
};

/**
 * Hook pour rechercher des licences avec debounce.
 *
 * `competitionId` (optionnel) : si fourni, chaque licence renvoyée contient
 * un `helloAssoPayment` indiquant le statut du paiement HelloAsso sur cette
 * compétition (jointure SQL côté backend, pas d'appel HTTP supplémentaire).
 */
export function useSearchLicences(competitionId?: number) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedTerm(value);
  }, 300);

  const updateSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      debouncedSetSearch(value);
    },
    [debouncedSetSearch]
  );

  const query = useQuery({
    queryKey: searchLicencesKeys.search(debouncedTerm, competitionId),
    queryFn: () =>
      licencesApi.getAll({
        search: debouncedTerm,
        limit: 30,
        offset: 0,
        competitionId,
      }),
    enabled: debouncedTerm.length >= 2,
    staleTime: 30000, // 30 secondes de cache
  });

  const licences = useMemo<LicenceType[]>(() => {
    return query.data?.data ?? [];
  }, [query.data]);

  return {
    searchTerm,
    setSearchTerm: updateSearch,
    licences,
    isLoading: query.isLoading && debouncedTerm.length >= 2,
    isSearching: searchTerm !== debouncedTerm,
  };
}
