import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { licencesApi, type CreateLicenceDto, type UpdateLicenceDto } from '@/api/licences.api';
import useUserStore from '@/store/UserStore';
import type { LicenceType, LicenceFilters, PaginationParams } from '@/types/licences';

export const licencesKeys = {
  all: ['licences'] as const,
  list: (params: PaginationParams) => ['licences', 'list', params] as const,
  detail: (id: number) => ['licences', id] as const,
};

const FILTER_KEYS: (keyof LicenceType)[] = [
  'id',
  'licenceNumber',
  'name',
  'firstName',
  'club',
  'gender',
  'dept',
  'birthYear',
  'catea',
  'catev',
  'catevCX',
  'fede',
  'saison',
  'comment',
];

function parseUrlParams(searchParams: URLSearchParams): PaginationParams {
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const search = searchParams.get('search');
  const orderBy = searchParams.get('orderBy');
  const orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC' | null;

  const filters: LicenceFilters = {};
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

function buildUrlParams(params: PaginationParams): URLSearchParams {
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

export function useLicences() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

  const updateParams = useCallback(
    (newParams: Partial<PaginationParams>) => {
      const merged = { ...params, ...newParams };
      setSearchParams(buildUrlParams(merged), { replace: true });
    },
    [params, setSearchParams]
  );

  const query = useQuery({
    queryKey: licencesKeys.list(params),
    queryFn: () => licencesApi.getAll(params),
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

  const setFilters = useCallback(
    (filters: LicenceFilters) => {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      ) as LicenceFilters;
      updateParams({
        offset: 0,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
      });
    },
    [updateParams]
  );

  const setFilter = useCallback(
    (key: keyof LicenceType, value: string) => {
      const newFilters = { ...params.filters, [key]: value || undefined };
      const cleanFilters = Object.fromEntries(
        Object.entries(newFilters).filter(([, v]) => v)
      ) as LicenceFilters;
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

  const currentPage = Math.floor((params.offset || 0) / (params.limit || 20));
  const totalPages = query.data ? Math.ceil(query.data.meta.total / (params.limit || 20)) : 0;

  return {
    ...query,
    params,
    setLimit,
    setSearch,
    setFilters,
    setFilter,
    setSort,
    goToPage,
    currentPage,
    totalPages,
  };
}

export function useLicence(id: number | undefined) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: licencesKeys.detail(id!),
    queryFn: () => licencesApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });
}

export function useCreateLicence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (licence: CreateLicenceDto) => licencesApi.create(licence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] });
    },
  });
}

export function useUpdateLicence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateLicenceDto }) =>
      licencesApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licences'] });
      queryClient.invalidateQueries({
        queryKey: licencesKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteLicence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => licencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] });
    },
  });
}
