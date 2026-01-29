import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { clubsApi } from '@/api/clubs.api';
import useUserStore from '@/store/UserStore';
import type { ClubType, ClubPaginationParams, ClubFilters, UpdateClubInput } from '@/types/clubs';

const FILTER_KEYS: (keyof ClubType)[] = ['shortName', 'dept', 'fede', 'longName', 'elicenceName'];

export const clubsKeys = {
  all: ['clubs'] as const,
  list: (params: ClubPaginationParams) => ['clubs', 'list', params] as const,
  byFedeAndDept: (fede: string, dept: string) => ['clubs', 'fede', fede, 'dept', dept] as const,
  detail: (id: number) => ['clubs', id] as const,
  references: (id: number) => ['clubs', id, 'references'] as const,
};

function parseUrlParams(searchParams: URLSearchParams): ClubPaginationParams {
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const search = searchParams.get('search');
  const orderBy = searchParams.get('orderBy');
  const orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC' | null;

  const filters: ClubFilters = {};
  FILTER_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  });

  return {
    offset: offset ? parseInt(offset, 10) : 0,
    limit: limit ? parseInt(limit, 10) : 20,
    search: search || undefined,
    orderBy: orderBy || undefined,
    orderDirection: orderDirection || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  };
}

function buildUrlParams(params: ClubPaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.offset && params.offset > 0) searchParams.set('offset', String(params.offset));
  if (params.limit && params.limit !== 20) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection);

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }

  return searchParams;
}

export function useClubsPaginated() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

  const updateParams = useCallback(
    (newParams: Partial<ClubPaginationParams>) => {
      const merged = { ...params, ...newParams };
      setSearchParams(buildUrlParams(merged), { replace: true });
    },
    [params, setSearchParams],
  );

  const query = useQuery({
    queryKey: clubsKeys.list(params),
    queryFn: () => clubsApi.getAllPaginated(params),
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const setLimit = useCallback(
    (limit: number) => updateParams({ offset: 0, limit }),
    [updateParams],
  );

  const setSearch = useCallback(
    (search: string) => updateParams({ offset: 0, search: search || undefined }),
    [updateParams],
  );

  const goToPage = useCallback(
    (page: number) => {
      const limit = params.limit || 20;
      updateParams({ offset: page * limit });
    },
    [params.limit, updateParams],
  );

  const setSort = useCallback(
    (column: string, direction: 'ASC' | 'DESC') => updateParams({ orderBy: column, orderDirection: direction }),
    [updateParams],
  );

  const setFilter = useCallback(
    (key: keyof ClubType, value: string) => {
      const newFilters = { ...params.filters, [key]: value || undefined };
      const cleanFilters = Object.fromEntries(
        Object.entries(newFilters).filter(([, v]) => v),
      ) as ClubFilters;
      updateParams({
        offset: 0,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
      });
    },
    [params.filters, updateParams],
  );

  const currentPage = Math.floor((params.offset || 0) / (params.limit || 20));
  const totalPages = query.data ? Math.ceil(query.data.meta.total / (params.limit || 20)) : 0;

  return {
    ...query,
    params,
    setLimit,
    setSearch,
    setSort,
    setFilter,
    goToPage,
    currentPage,
    totalPages,
  };
}

// Legacy hook — used by ClubAutocomplete and other existing components
export function useClubs() {
  return useQuery({
    queryKey: clubsKeys.all,
    queryFn: () => clubsApi.getAll(),
  });
}

export function useClubsByFedeAndDept(fede: string, dept: string) {
  return useQuery({
    queryKey: clubsKeys.byFedeAndDept(fede, dept),
    queryFn: () => clubsApi.getByFedeAndDept(fede, dept),
    enabled: !!fede && !!dept,
  });
}

export function useClub(id: number | undefined) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: clubsKeys.detail(id!),
    queryFn: () => clubsApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });
}

export function useClubReferences(id: number | undefined) {
  return useQuery({
    queryKey: clubsKeys.references(id!),
    queryFn: () => clubsApi.getReferences(id!),
    enabled: false,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (club: Omit<ClubType, 'id'>) => clubsApi.create(club),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateClubInput }) =>
      clubsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clubsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}
