import { isMockMode } from '@/config/api.config';
import { mockClubsService } from '@/services/mocks/clubs.mock.service';
import type { ClubType } from '@/types/clubs';

import { apiClient } from './client';

const realClubsService = {
  getAll: (): Promise<ClubType[]> => apiClient<ClubType[]>('/clubs'),

  getByDepartment: (department: string): Promise<ClubType[]> =>
    apiClient<ClubType[]>(`/clubs?department=${encodeURIComponent(department)}`),

  search: (query: string): Promise<ClubType[]> =>
    apiClient<ClubType[]>(`/clubs?search=${encodeURIComponent(query)}`),

  getById: (id: string): Promise<ClubType> => apiClient<ClubType>(`/clubs/${id}`),

  create: (club: Omit<ClubType, 'id'>): Promise<ClubType> =>
    apiClient<ClubType>('/clubs', {
      method: 'POST',
      body: JSON.stringify(club),
    }),
};

export const clubsApi = isMockMode('clubs') ? mockClubsService : realClubsService;
