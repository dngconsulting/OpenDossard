import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { usersApi } from '@/api/users.api';
import useUserStore from '@/store/UserStore';
import type { UserType, UserPaginationParams, CreateUserInput } from '@/types/users';

export const usersKeys = {
  all: ['users'] as const,
  list: (params: UserPaginationParams) => ['users', 'list', params] as const,
  detail: (id: number) => ['users', id] as const,
};

function parseUrlParams(searchParams: URLSearchParams): UserPaginationParams {
  const offset = searchParams.get('offset');
  const limit = searchParams.get('limit');
  const search = searchParams.get('search');
  const orderBy = searchParams.get('orderBy');
  const orderDirection = searchParams.get('orderDirection') as 'ASC' | 'DESC' | null;

  return {
    offset: offset ? parseInt(offset, 10) : 0,
    limit: limit ? parseInt(limit, 10) : 20,
    search: search || undefined,
    orderBy: orderBy || undefined,
    orderDirection: orderDirection || undefined,
  };
}

function buildUrlParams(params: UserPaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.offset && params.offset > 0) searchParams.set('offset', String(params.offset));
  if (params.limit && params.limit !== 20) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection);

  return searchParams;
}

export function useUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  const params = useMemo(() => parseUrlParams(searchParams), [searchParams]);

  const updateParams = useCallback(
    (newParams: Partial<UserPaginationParams>) => {
      const merged = { ...params, ...newParams };
      setSearchParams(buildUrlParams(merged), { replace: true });
    },
    [params, setSearchParams]
  );

  const query = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.getAll(params),
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
    setSort,
    goToPage,
    currentPage,
    totalPages,
  };
}

export function useUser(id: number | undefined) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: usersKeys.detail(id!),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id && isAuthenticated,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: CreateUserInput) => usersApi.create(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<UserType> }) =>
      usersApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({
        queryKey: usersKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
