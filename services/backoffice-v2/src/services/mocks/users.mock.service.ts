import type { UserTableType } from '@/components/data/UsersTable'
import { users as initialUsers } from '@/mocks/users.mocks'

let usersData: UserTableType[] = [...initialUsers]

const delay = () => new Promise((resolve) => setTimeout(resolve, 300))

export const mockUsersService = {
  getAll: async (): Promise<UserTableType[]> => {
    await delay()
    return [...usersData]
  },

  getByEmail: async (email: string): Promise<UserTableType | undefined> => {
    await delay()
    return usersData.find((u) => u.email === email)
  },

  create: async (
    user: UserTableType
  ): Promise<UserTableType> => {
    await delay()
    if (usersData.find((u) => u.email === user.email)) {
      throw new Error('User with this email already exists')
    }
    usersData.push(user)
    return user
  },

  update: async (
    email: string,
    updates: Partial<UserTableType>
  ): Promise<UserTableType> => {
    await delay()
    const index = usersData.findIndex((u) => u.email === email)
    if (index === -1) {throw new Error('User not found')}

    if (updates.email && updates.email !== email) {
      if (usersData.find((u) => u.email === updates.email)) {
        throw new Error('User with this email already exists')
      }
    }

    usersData[index] = { ...usersData[index], ...updates }
    return usersData[index]
  },

  delete: async (email: string): Promise<void> => {
    await delay()
    usersData = usersData.filter((u) => u.email !== email)
  },
}
