import { isMockMode } from '@/config/api.config'
import { mockLicencesService } from '@/services/mocks/licences.mock.service'
import type { LicenceType } from '@/types/licences'

import { apiClient } from './client'

const realLicencesService = {
  getAll: (): Promise<LicenceType[]> => apiClient<LicenceType[]>('/licences'),

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
