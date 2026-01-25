import type { UserType, UserPaginationParams, PaginatedResponse, CreateUserInput } from '@/types/users';
import { users as initialUsers } from '@/mocks/users.mocks';

let usersData: UserType[] = [...initialUsers];
let nextId = usersData.length + 1;

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockUsersService = {
  getAll: async (params: UserPaginationParams = {}): Promise<PaginatedResponse<UserType>> => {
    await delay();
    const { offset = 0, limit = 20, search, orderBy = 'lastName', orderDirection = 'ASC' } = params;

    let filtered = [...usersData];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email.toLowerCase().includes(searchLower) ||
          u.firstName.toLowerCase().includes(searchLower) ||
          u.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = String(a[orderBy as keyof UserType] || '').toLowerCase();
      const bVal = String(b[orderBy as keyof UserType] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return orderDirection === 'DESC' ? -comparison : comparison;
    });

    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      meta: {
        offset,
        limit,
        total,
        hasMore: offset + data.length < total,
      },
    };
  },

  getById: async (id: number): Promise<UserType | undefined> => {
    await delay();
    return usersData.find(u => u.id === id);
  },

  create: async (user: CreateUserInput): Promise<UserType> => {
    await delay();
    if (usersData.find(u => u.email === user.email)) {
      throw new Error('User with this email already exists');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    const newUser: UserType = { ...userWithoutPassword, id: nextId++ };
    usersData.push(newUser);
    return newUser;
  },

  update: async (id: number, updates: Partial<UserType>): Promise<UserType> => {
    await delay();
    const index = usersData.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }

    if (updates.email && updates.email !== usersData[index].email) {
      if (usersData.find(u => u.email === updates.email)) {
        throw new Error('User with this email already exists');
      }
    }

    usersData[index] = { ...usersData[index], ...updates };
    return usersData[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay();
    usersData = usersData.filter(u => u.id !== id);
  },
};
