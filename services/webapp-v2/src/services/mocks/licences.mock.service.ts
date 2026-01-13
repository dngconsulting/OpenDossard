import { licences as initialLicences } from '@/mocks/licences.mocks';
import type { LicenceType, PaginatedResponse, PaginationParams } from '@/types/licences';

let licencesData: LicenceType[] = [...initialLicences];

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockLicencesService = {
  getAll: async (params: PaginationParams = {}): Promise<PaginatedResponse<LicenceType>> => {
    await delay();
    const { offset = 0, limit = 20, search, orderBy = 'lastName', orderDirection = 'ASC' } = params;

    let filtered = [...licencesData];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.lastName?.toLowerCase().includes(searchLower) ||
          l.firstName?.toLowerCase().includes(searchLower) ||
          l.licenceNumber?.toLowerCase().includes(searchLower) ||
          l.club?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = String(a[orderBy as keyof LicenceType] || '').toLowerCase();
      const bVal = String(b[orderBy as keyof LicenceType] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return orderDirection === 'ASC' ? comparison : -comparison;
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

  getById: async (id: string): Promise<LicenceType | undefined> => {
    await delay();
    return licencesData.find(l => l.id === id);
  },

  create: async (licence: Omit<LicenceType, 'id'>): Promise<LicenceType> => {
    await delay();
    const newLicence = { ...licence, id: crypto.randomUUID() };
    licencesData.push(newLicence);
    return newLicence;
  },

  update: async (id: string, updates: Partial<LicenceType>): Promise<LicenceType> => {
    await delay();
    const index = licencesData.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Licence not found');
    }
    licencesData[index] = { ...licencesData[index], ...updates };
    return licencesData[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    licencesData = licencesData.filter(l => l.id !== id);
  },
};
