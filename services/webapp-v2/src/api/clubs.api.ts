import type { ClubType, ClubPaginationParams, ClubReferences, UpdateClubInput } from '@/types/clubs';
import type { PaginatedResponse } from '@/types/users';

import { apiClient } from './client';
import { buildQueryString } from './_query-string';

export const clubsApi = {
  getAllPaginated: (params: ClubPaginationParams = {}): Promise<PaginatedResponse<ClubType>> =>
    apiClient<PaginatedResponse<ClubType>>(`/clubs${buildQueryString(params)}`),

  getAll: (): Promise<ClubType[]> => apiClient<ClubType[]>('/clubs/legacy'),

  getByFedeAndDept: (fede: string, dept: string): Promise<ClubType[]> =>
    apiClient<ClubType[]>(`/clubs/legacy?fede=${encodeURIComponent(fede)}&dept=${encodeURIComponent(dept)}`),

  /**
   * Recherche legacy multi-département. Utilise le param `dept` répété
   * (`?dept=31&dept=81`). `fede` reste single.
   */
  searchLegacy: (params: { fede?: string; depts?: string[] }): Promise<ClubType[]> => {
    const sp = new URLSearchParams();
    if (params.fede) {sp.set('fede', params.fede);}
    if (params.depts && params.depts.length > 0) {
      params.depts.forEach(d => sp.append('dept', d));
    }
    const qs = sp.toString();
    return apiClient<ClubType[]>(`/clubs/legacy${qs ? `?${qs}` : ''}`);
  },

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
