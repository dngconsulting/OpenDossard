import type { ChallengeRider, ChallengeType } from '@/types/challenges';

import { apiClient } from './client';

export const challengesApi = {
  // Get all challenges (optionally filter by active status)
  getAll: (active?: boolean): Promise<ChallengeType[]> => {
    const query = active !== undefined ? `?active=${active}` : '';
    return apiClient<ChallengeType[]>(`/challenges${query}`);
  },

  // Get a single challenge by ID
  getById: (id: number): Promise<ChallengeType> => apiClient<ChallengeType>(`/challenges/${id}`),

  // Get challenge ranking/classement
  getRanking: (id: number): Promise<ChallengeRider[]> =>
    apiClient<ChallengeRider[]>(`/challenges/${id}/ranking`),

  // Create a new challenge
  create: (data: Omit<ChallengeType, 'id'>): Promise<ChallengeType> =>
    apiClient<ChallengeType>('/challenges', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a challenge
  update: (id: number, data: Partial<ChallengeType>): Promise<ChallengeType> =>
    apiClient<ChallengeType>(`/challenges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete a challenge
  delete: (id: number): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/challenges/${id}`, {
      method: 'DELETE',
    }),
};
