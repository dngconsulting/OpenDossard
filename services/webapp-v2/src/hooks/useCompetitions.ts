import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { competitionsApi } from '@/api/competitions.api';
import useUserStore from '@/store/UserStore';
import type {
  CompetitionType,
  CompetitionFilters,
  CompetitionPaginationParams,
  CompetitionFormData,
} from '@/types/competitions';

export const competitionsKeys = {
  all: ['competitions'] as const,
  list: (params: CompetitionPaginationParams) => ['competitions', 'list', params] as const,
  detail: (id: number) => ['competitions', id] as const,
};

const FILTER_KEYS: (keyof CompetitionType)[] = [
  'id',
  'name',
  'zipCode',
  'fede',
  'competitionType',
  'dept',
  'club',
];

const ADVANCED_FILTER_KEYS = ['fedes', 'competitionTypes', 'depts', 'displayPast', 'displayFuture', 'startDate', 'endDate'];

function parseUrlParams(searchParams: URLSearchParams): CompetitionPaginationParams {
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const search = searchParams.get('search');
  const orderBy = searchParams.get('orderBy');
  const orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC' | null;

  const filters: CompetitionFilters = {};
  FILTER_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  });

  const params: CompetitionPaginationParams = {
    offset: offset ? parseInt(offset, 10) : 0,
    limit: limit ? parseInt(limit, 10) : 20,
    search: search || undefined,
    orderBy: orderBy || 'eventDate',
    orderDirection: orderDirection || 'DESC',
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  };

  // Parse advanced filters
  ADVANCED_FILTER_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) (params as any)[key] = value;
  });

  return params;
}

function buildUrlParams(params: CompetitionPaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.offset && params.offset > 0) searchParams.set('offset', String(params.offset));
  if (params.limit && params.limit !== 20) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy && params.orderBy !== 'eventDate') searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection && params.orderDirection !== 'DESC') searchParams.set('orderDirection', params.orderDirection);

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }

  // Advanced filters
  ADVANCED_FILTER_KEYS.forEach(key => {
    const value = (params as any)[key];
    if (value) searchParams.set(key, value);
  });

  return searchParams;
}

export function useCompetitions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

  const updateParams = useCallback(
    (newParams: Partial<CompetitionPaginationParams>) => {
      const merged = { ...params, ...newParams };
      setSearchParams(buildUrlParams(merged), { replace: true });
    },
    [params, setSearchParams]
  );

  const query = useQuery({
    queryKey: competitionsKeys.list(params),
    queryFn: () => competitionsApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const setLimit = useCallback(
    (limit: number) => {
      updateParams({ offset: 0, limit });
    },
    [updateParams]
  );

  const setSearch = useCallback(
    (search: string) => {
      updateParams({ offset: 0, search: search || undefined });
    },
    [updateParams]
  );

  const setFilter = useCallback(
    (key: keyof CompetitionType, value: string) => {
      const newFilters = { ...params.filters, [key]: value || undefined };
      const cleanFilters = Object.fromEntries(
        Object.entries(newFilters).filter(([, v]) => v)
      ) as CompetitionFilters;
      updateParams({
        offset: 0,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
      });
    },
    [params.filters, updateParams]
  );

  const goToPage = useCallback(
    (page: number) => {
      const limit = params.limit || 20;
      updateParams({ offset: page * limit });
    },
    [params.limit, updateParams]
  );

  const setSort = useCallback(
    (column: string, direction: 'ASC' | 'DESC') => {
      updateParams({ orderBy: column, orderDirection: direction });
    },
    [updateParams]
  );

  const setAdvancedFilters = useCallback(
    (filters: Partial<CompetitionPaginationParams>) => {
      updateParams({ offset: 0, ...filters });
    },
    [updateParams]
  );

  const currentPage = Math.floor((params.offset || 0) / (params.limit || 20));
  const totalPages = query.data ? Math.ceil(query.data.meta.total / (params.limit || 20)) : 0;

  return {
    ...query,
    params,
    setLimit,
    setSearch,
    setFilter,
    setSort,
    setAdvancedFilters,
    goToPage,
    currentPage,
    totalPages,
  };
}

export function useCompetition(id: number | undefined) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: competitionsKeys.detail(id!),
    queryFn: () => competitionsApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });
}

export function useDuplicateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => competitionsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => competitionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompetitionFormData) => competitionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}

export function useUpdateCompetition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompetitionFormData> }) =>
      competitionsApi.update(id, data),
    onSuccess: () => {
      // Invalidates all queries starting with ['competitions'], including list and detail
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
}
