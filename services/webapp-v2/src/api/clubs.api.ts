import type {
  ClubType,
  ClubPaginationParams,
  ClubReferences,
  UpdateClubInput,
  AccessibleClubsScope,
} from '@/types/clubs';
import type { PaginatedResponse } from '@/types/users';

import { buildQueryString } from './_query-string';
import { apiClient } from './client';

export const clubsApi = {
  getAllPaginated: (params: ClubPaginationParams = {}): Promise<PaginatedResponse<ClubType>> =>
    apiClient<PaginatedResponse<ClubType>>(`/clubs${buildQueryString(params)}`),

  getAll: (): Promise<ClubType[]> => apiClient<ClubType[]>('/clubs/legacy'),

  getByFedeAndDept: (fede: string, dept: string): Promise<ClubType[]> =>
    apiClient<ClubType[]>(`/clubs/legacy?fede=${encodeURIComponent(fede)}&dept=${encodeURIComponent(dept)}`),

  /**
   * Recherche legacy multi-fédération + multi-département. Utilise les params
   * `fede` et `dept` répétés (`?fede=FSGT&fede=UFOLEP&dept=31&dept=81`).
   */
  searchLegacy: (params: { fedes?: string[]; depts?: string[] }): Promise<ClubType[]> => {
    const sp = new URLSearchParams();
    if (params.fedes && params.fedes.length > 0) {
      params.fedes.forEach(f => sp.append('fede', f));
    }
    if (params.depts && params.depts.length > 0) {
      params.depts.forEach(d => sp.append('dept', d));
    }
    const qs = sp.toString();
    return apiClient<ClubType[]>(`/clubs/legacy${qs ? `?${qs}` : ''}`);
  },

  /**
   * Scope d'édition/suppression de clubs pour l'utilisateur courant.
   * Utilisé par `useAccessibleClubs` pour griser les boutons édit/suppr
   * des clubs hors scope dans la liste des clubs.
   */
  getMyAccessibleScope: (): Promise<AccessibleClubsScope> =>
    apiClient<AccessibleClubsScope>('/clubs/me/accessible'),

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
