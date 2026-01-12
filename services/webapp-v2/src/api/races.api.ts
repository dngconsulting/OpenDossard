import { isMockMode } from '@/config/api.config';
import { mockRacesService, addEngagedRiderMock, removeEngagedRiderMock } from '@/services/mocks/races.mock.service';
import type { RaceType, EngagedRider } from '@/types/races.ts';

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

  addEngagedRider: (data: {
    raceId: string
    categoryId: string
    rider: Omit<EngagedRider, 'id'>
  }): Promise<EngagedRider> =>
    apiClient<EngagedRider>(`/races/${data.raceId}/categories/${data.categoryId}/engaged`, {
      method: 'POST',
      body: JSON.stringify(data.rider),
    }),

  removeEngagedRider: (data: {
    raceId: string
    categoryId: string
    riderId: string
  }): Promise<void> =>
    apiClient<void>(`/races/${data.raceId}/categories/${data.categoryId}/engaged/${data.riderId}`, {
      method: 'DELETE',
    }),
};

const mockServiceWithEngagedRiders = {
  ...mockRacesService,
  addEngagedRider: (data: {
    raceId: string
    categoryId: string
    rider: Omit<EngagedRider, 'id'>
  }) => addEngagedRiderMock(data.raceId, data.categoryId, data.rider),

  removeEngagedRider: (data: {
    raceId: string
    categoryId: string
    riderId: string
  }) => removeEngagedRiderMock(data.raceId, data.categoryId, data.riderId),
};

export const racesApi = isMockMode('races') ? mockServiceWithEngagedRiders : realRacesService;
