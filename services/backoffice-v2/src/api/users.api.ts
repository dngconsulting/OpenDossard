import type { UserTableType } from '@/components/data/UsersTable'
import { isMockMode } from '@/config/api.config'
import { mockUsersService } from '@/services/mocks/users.mock.service'

import { apiClient } from './client'

const realUsersService = {
  getAll: (): Promise<UserTableType[]> => apiClient<UserTableType[]>('/users'),

  getByEmail: (email: string): Promise<UserTableType> =>
    apiClient<UserTableType>(`/users/${encodeURIComponent(email)}`),

  create: (user: UserTableType): Promise<UserTableType> =>
    apiClient<UserTableType>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  update: (
    email: string,
    updates: Partial<UserTableType>
  ): Promise<UserTableType> =>
    apiClient<UserTableType>(`/users/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (email: string): Promise<void> =>
    apiClient<void>(`/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),
}

export const usersApi = isMockMode('users')
  ? mockUsersService
  : realUsersService
