import type { UserType, UserPaginationParams, PaginatedResponse, CreateUserInput } from '@/types/users';
import { isMockMode } from '@/config/api.config';
import { mockUsersService } from '@/services/mocks/users.mock.service';

import { apiClient } from './client';

const buildQueryString = (params: UserPaginationParams): string => {
  const searchParams = new URLSearchParams();

  if (params.offset && params.offset > 0) searchParams.set('offset', String(params.offset));
  if (params.limit && params.limit !== 20) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
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
};

export const usersApi = isMockMode('users') ? mockUsersService : realUsersService;
