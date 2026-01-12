import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { usersApi } from '@/api/users.api'
import type { UserTableType } from '@/components/data/UsersTable'

export const usersKeys = {
  all: ['users'] as const,
  detail: (email: string) => ['users', email] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.all,
    queryFn: () => usersApi.getAll(),
  })
}

export function useUser(email: string) {
  return useQuery({
    queryKey: usersKeys.detail(email),
    queryFn: () => usersApi.getByEmail(email),
    enabled: !!email,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (user: UserTableType) => usersApi.create(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      email,
      updates,
    }: {
      email: string
      updates: Partial<UserTableType>
    }) => usersApi.update(email, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      queryClient.invalidateQueries({
        queryKey: usersKeys.detail(variables.email),
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) => usersApi.delete(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}
