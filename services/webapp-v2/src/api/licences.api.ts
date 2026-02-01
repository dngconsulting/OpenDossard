import type { LicenceType, PaginatedResponse, PaginationParams } from '@/types/licences';

import { apiClient } from './client';

const buildQueryString = (params: PaginationParams): string => {
  const searchParams = new URLSearchParams();
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection);
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export type CreateLicenceDto = {
  name: string;
  firstName: string;
  licenceNumber?: string;
  gender: string;
  birthYear: string;
  dept: string;
  fede: string;
  club?: string;
  catea: string;
  catev?: string;
  catevCX?: string;
  saison?: string;
  comment?: string;
};

export type UpdateLicenceDto = Partial<CreateLicenceDto>;

export type ImportResult = {
  summary: {
    total: number;
    created: number;
    updated: number;
    unchanged: number;
    skipped: number;
  };
  details: {
    created: Array<{ licenceNumber: string; name: string; firstName: string; club: string }>;
    updated: Array<{ licenceNumber: string; name: string; firstName: string; changes: string[] }>;
    warnings: Array<{ licenceNumber: string; name: string; firstName: string; message: string }>;
    skipped: Array<{ rider: string; reason: string }>;
  };
};

export const licencesApi = {
  getAll: (params: PaginationParams = {}): Promise<PaginatedResponse<LicenceType>> =>
    apiClient<PaginatedResponse<LicenceType>>(`/licences${buildQueryString(params)}`),

  getById: (id: number): Promise<LicenceType> => apiClient<LicenceType>(`/licences/${id}`),

  create: (licence: CreateLicenceDto): Promise<LicenceType> =>
    apiClient<LicenceType>('/licences', {
      method: 'POST',
      body: JSON.stringify(licence),
    }),

  update: (id: number, updates: UpdateLicenceDto): Promise<LicenceType> =>
    apiClient<LicenceType>(`/licences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: number): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/licences/${id}`, {
      method: 'DELETE',
    }),

  importElicence: (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<ImportResult>('/licences/import', {
      method: 'POST',
      body: formData,
    });
  },
};
