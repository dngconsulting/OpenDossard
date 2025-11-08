import type { ChallengeTableType } from '@/components/data/ChallengeTable';
import { isMockMode } from '@/config/api.config';
import { mockChallengesService } from '@/services/mocks/challenges.mock.service';

import { apiClient } from './client';

const realChallengesService = {
  getAll: (): Promise<ChallengeTableType[]> => apiClient<ChallengeTableType[]>('/challenges'),

  getById: (id: string): Promise<ChallengeTableType> =>
    apiClient<ChallengeTableType>(`/challenges/${id}`),

  create: (challenge: Omit<ChallengeTableType, 'id'>): Promise<ChallengeTableType> =>
    apiClient<ChallengeTableType>('/challenges', {
      method: 'POST',
      body: JSON.stringify(challenge),
    }),

  update: (id: string, updates: Partial<ChallengeTableType>): Promise<ChallengeTableType> =>
    apiClient<ChallengeTableType>(`/challenges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: string): Promise<void> =>
    apiClient<void>(`/challenges/${id}`, {
      method: 'DELETE',
    }),
};

export const challengesApi = isMockMode('challenges')
  ? mockChallengesService
  : realChallengesService;
