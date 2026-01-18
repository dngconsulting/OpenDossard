import type { ClubType } from '@/types/clubs';

import { apiClient } from './client';

export const clubsApi = {
  getAll: (): Promise<ClubType[]> => apiClient<ClubType[]>('/clubs'),

  // V2 style: GET /clubs?fede=X&dept=Y
  getByFedeAndDept: (fede: string, dept: string): Promise<ClubType[]> =>
    apiClient<ClubType[]>(`/clubs?fede=${encodeURIComponent(fede)}&dept=${encodeURIComponent(dept)}`),

  getById: (id: string): Promise<ClubType> => apiClient<ClubType>(`/clubs/${id}`),

  create: (club: Omit<ClubType, 'id'>): Promise<ClubType> =>
    apiClient<ClubType>('/clubs', {
      method: 'POST',
      body: JSON.stringify(club),
    }),
};
