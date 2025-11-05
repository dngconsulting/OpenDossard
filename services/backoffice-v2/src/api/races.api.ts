import { isMockMode } from '@/config/api.config';
import { mockRacesService } from '@/services/mocks/races.mock.service';
import type { RaceType } from '@/types/races.ts';

import { apiClient } from './client';

const realRacesService = {
  getAll: (): Promise<RaceType[]> => apiClient<RaceType[]>('/races'),

  getById: (id: string): Promise<RaceType> => apiClient<RaceType>(`/races/${id}`),

  create: (race: Omit<RaceType, 'id'>): Promise<RaceType> =>
    apiClient<RaceType>('/races', {
      method: 'POST',
      body: JSON.stringify(race),
    }),

  update: (id: string, updates: Partial<RaceType>): Promise<RaceType> =>
    apiClient<RaceType>(`/races/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(`/races/${id}`, {
      method: 'DELETE',
    }),
};

export const racesApi = isMockMode('races') ? mockRacesService : realRacesService;
