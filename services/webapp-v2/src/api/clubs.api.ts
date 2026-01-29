import type { ClubType, ClubPaginationParams, ClubReferences, UpdateClubInput } from '@/types/clubs';
import type { PaginatedResponse } from '@/types/users';

import { apiClient } from './client';

const buildQueryString = (params: ClubPaginationParams): string => {
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

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

export const clubsApi = {
  getAllPaginated: (params: ClubPaginationParams = {}): Promise<PaginatedResponse<ClubType>> =>
    apiClient<PaginatedResponse<ClubType>>(`/clubs${buildQueryString(params)}`),

  getAll: (): Promise<ClubType[]> => apiClient<ClubType[]>('/clubs/legacy'),

  getByFedeAndDept: (fede: string, dept: string): Promise<ClubType[]> =>
    apiClient<ClubType[]>(`/clubs/legacy?fede=${encodeURIComponent(fede)}&dept=${encodeURIComponent(dept)}`),

  getById: (id: number): Promise<ClubType> => apiClient<ClubType>(`/clubs/${id}`),

  getReferences: (id: number): Promise<ClubReferences> =>
    apiClient<ClubReferences>(`/clubs/${id}/references`),

  create: (club: Omit<ClubType, 'id'>): Promise<ClubType> =>
    apiClient<ClubType>('/clubs', {
      method: 'POST',
      body: JSON.stringify(club),
    }),

  update: (id: number, updates: UpdateClubInput): Promise<ClubType> =>
    apiClient<ClubType>(`/clubs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: number): Promise<void> =>
    apiClient<void>(`/clubs/${id}`, {
      method: 'DELETE',
    }),
};
