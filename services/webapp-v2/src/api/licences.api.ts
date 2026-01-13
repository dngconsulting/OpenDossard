import { isMockMode } from '@/config/api.config'
import { mockLicencesService } from '@/services/mocks/licences.mock.service'
import type { LicenceType, PaginatedResponse, PaginationParams } from '@/types/licences'

import { apiClient } from './client'

const buildQueryString = (params: PaginationParams): string => {
  const searchParams = new URLSearchParams()
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset))
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.orderBy) searchParams.set('orderBy', params.orderBy)
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection)
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const realLicencesService = {
  getAll: (params: PaginationParams = {}): Promise<PaginatedResponse<LicenceType>> =>
    apiClient<PaginatedResponse<LicenceType>>(`/licences${buildQueryString(params)}`),

  getById: (id: string): Promise<LicenceType> =>
    apiClient<LicenceType>(`/licences/${id}`),

  create: (licence: Omit<LicenceType, 'id'>): Promise<LicenceType> =>
    apiClient<LicenceType>('/licences', {
      method: 'POST',
      body: JSON.stringify(licence),
    }),

  update: (
    id: string,
    updates: Partial<LicenceType>
  ): Promise<LicenceType> =>
    apiClient<LicenceType>(`/licences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(`/licences/${id}`, {
      method: 'DELETE',
    }),
}

export const licencesApi = isMockMode('licences')
  ? mockLicencesService
  : realLicencesService
