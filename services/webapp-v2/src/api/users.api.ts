import { isMockMode } from '@/config/api.config';
import { mockUsersService } from '@/services/mocks/users.mock.service';
import type { ClubType } from '@/types/clubs';
import type { UserType, UserPaginationParams, PaginatedResponse, CreateUserInput } from '@/types/users';

import { apiClient } from './client';
import { buildQueryString } from './_query-string';

export type SetUserClubsResponse = {
  clubs: ClubType[];
  added: number[];
  removed: number[];
};

const realUsersService = {
  getAll: (params: UserPaginationParams = {}): Promise<PaginatedResponse<UserType>> =>
    apiClient<PaginatedResponse<UserType>>(`/users${buildQueryString(params)}`),

  getById: (id: number): Promise<UserType> => apiClient<UserType>(`/users/${id}`),

  create: (user: CreateUserInput): Promise<UserType> => {
    // Convert roles string to array for the API
    const apiUser = {
      ...user,
      roles: user.roles ? user.roles.split(',').filter(Boolean) : ['ORGANISATEUR'],
    };
    return apiClient<UserType>('/users', {
      method: 'POST',
      body: JSON.stringify(apiUser),
    });
  },

  update: (id: number, updates: Partial<UserType>): Promise<UserType> => {
    // Convert roles string to array for the API
    const apiUpdates = {
      ...updates,
      roles: updates.roles ? updates.roles.split(',').filter(Boolean) : undefined,
    };
    return apiClient<UserType>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(apiUpdates),
    });
  },

  delete: (id: number): Promise<void> =>
    apiClient<void>(`/users/${id}`, {
      method: 'DELETE',
    }),

  getClubs: (id: number): Promise<ClubType[]> => apiClient<ClubType[]>(`/users/${id}/clubs`),

  setClubs: (id: number, clubIds: number[]): Promise<SetUserClubsResponse> =>
    apiClient<SetUserClubsResponse>(`/users/${id}/clubs`, {
      method: 'PUT',
      body: JSON.stringify({ clubIds }),
    }),
};

export const usersApi = isMockMode('users') ? mockUsersService : realUsersService;
