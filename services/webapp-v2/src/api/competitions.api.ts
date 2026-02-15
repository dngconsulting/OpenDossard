import type {
  CompetitionType,
  CompetitionDetailType,
  CompetitionFormData,
  CompetitionPaginationParams,
  PaginatedCompetitionResponse,
} from '@/types/competitions';

import { apiClient } from './client';

const buildQueryString = (params: CompetitionPaginationParams): string => {
  const searchParams = new URLSearchParams();

  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset));
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.orderBy) {
    searchParams.set('orderBy', params.orderBy);
  }
  if (params.orderDirection) {
    searchParams.set('orderDirection', params.orderDirection);
  }

  // Filtres par colonne
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
  }

  // Filtres avancés
  if (params.fedes) {
    searchParams.set('fedes', params.fedes);
  }
  if (params.competitionTypes) {
    searchParams.set('competitionTypes', params.competitionTypes);
  }
  if (params.depts) {
    searchParams.set('depts', params.depts);
  }
  if (params.startDate) {
    searchParams.set('startDate', params.startDate);
  }
  if (params.endDate) {
    searchParams.set('endDate', params.endDate);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const competitionsApi = {
  getAll: (params: CompetitionPaginationParams = {}): Promise<PaginatedCompetitionResponse> =>
    apiClient<PaginatedCompetitionResponse>(`/competitions${buildQueryString(params)}`),

  getById: (id: number): Promise<CompetitionDetailType> =>
    apiClient<CompetitionDetailType>(`/competitions/${id}`),

  create: (data: CompetitionFormData): Promise<CompetitionDetailType> =>
    apiClient<CompetitionDetailType>('/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CompetitionFormData>): Promise<CompetitionDetailType> =>
    apiClient<CompetitionDetailType>(`/competitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/competitions/${id}`, {
      method: 'DELETE',
    }),

  duplicate: (id: number): Promise<CompetitionType> =>
    apiClient<CompetitionType>(`/competitions/${id}/duplicate`, {
      method: 'POST',
    }),

  reorganize: (competitionId: number, races: string[]): Promise<void> =>
    apiClient<void>('/competitions/reorganize', {
      method: 'POST',
      body: JSON.stringify({ competitionId, races }),
    }),
};
