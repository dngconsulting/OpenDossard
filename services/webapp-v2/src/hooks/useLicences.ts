import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useState, useCallback } from 'react'

import { licencesApi } from '@/api/licences.api'
import useUserStore from '@/store/UserStore'
import type { LicenceType, PaginationParams } from '@/types/licences'

export const licencesKeys = {
  all: ['licences'] as const,
  list: (params: PaginationParams) => ['licences', 'list', params] as const,
  detail: (id: string) => ['licences', id] as const,
}

export function useLicences(initialParams: PaginationParams = { offset: 0, limit: 20 }) {
  const [params, setParams] = useState<PaginationParams>(initialParams)
  const isAuthenticated = useUserStore(state => state.isAuthenticated)

  const query = useQuery({
    queryKey: licencesKeys.list(params),
    queryFn: () => licencesApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
  })

  const setOffset = useCallback((offset: number) => {
    setParams(prev => ({ ...prev, offset }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setParams(prev => ({ ...prev, offset: 0, limit }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, offset: 0, search }))
  }, [])

  const nextPage = useCallback(() => {
    if (query.data?.meta.hasMore) {
      setParams(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 20) }))
    }
  }, [query.data?.meta.hasMore])

  const prevPage = useCallback(() => {
    setParams(prev => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 20)),
    }))
  }, [])

  const goToPage = useCallback((page: number) => {
    const limit = params.limit || 20
    setParams(prev => ({ ...prev, offset: page * limit }))
  }, [params.limit])

  return {
    ...query,
    params,
    setParams,
    setOffset,
    setLimit,
    setSearch,
    nextPage,
    prevPage,
    goToPage,
    currentPage: Math.floor((params.offset || 0) / (params.limit || 20)),
    totalPages: query.data ? Math.ceil(query.data.meta.total / (params.limit || 20)) : 0,
  }
}

export function useLicence(id: string) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated)

  return useQuery({
    queryKey: licencesKeys.detail(id),
    queryFn: () => licencesApi.getById(id),
    enabled: !!id && isAuthenticated,
  })
}

export function useCreateLicence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (licence: Omit<LicenceType, 'id'>) =>
      licencesApi.create(licence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] })
    },
  })
}

export function useUpdateLicence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<LicenceType>
    }) => licencesApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licences'] })
      queryClient.invalidateQueries({
        queryKey: licencesKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteLicence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => licencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] })
    },
  })
}
