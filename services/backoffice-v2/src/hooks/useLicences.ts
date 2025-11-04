import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { licencesApi } from '@/api/licences.api'
import type { LicenceType } from '@/types/licences'

export const licencesKeys = {
  all: ['licences'] as const,
  detail: (id: string) => ['licences', id] as const,
}

export function useLicences() {
  return useQuery({
    queryKey: licencesKeys.all,
    queryFn: () => licencesApi.getAll(),
  })
}

export function useLicence(id: string) {
  return useQuery({
    queryKey: licencesKeys.detail(id),
    queryFn: () => licencesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateLicence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (licence: Omit<LicenceType, 'id'>) =>
      licencesApi.create(licence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licencesKeys.all })
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
      queryClient.invalidateQueries({ queryKey: licencesKeys.all })
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
      queryClient.invalidateQueries({ queryKey: licencesKeys.all })
    },
  })
}
