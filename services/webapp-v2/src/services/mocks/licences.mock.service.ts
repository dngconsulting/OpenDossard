import { licences as initialLicences } from '@/mocks/licences.mocks';
import type { LicenceType, PaginatedResponse, PaginationParams } from '@/types/licences';

let licencesData: LicenceType[] = [...initialLicences];
let nextId = Math.max(...licencesData.map(l => l.id)) + 1;

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockLicencesService = {
  getAll: async (params: PaginationParams = {}): Promise<PaginatedResponse<LicenceType>> => {
    await delay();
    const {
      offset = 0,
      limit = 20,
      search,
      orderBy = 'name',
      orderDirection = 'ASC',
      filters,
    } = params;

    let filtered = [...licencesData];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.name?.toLowerCase().includes(searchLower) ||
          l.firstName?.toLowerCase().includes(searchLower) ||
          l.licenceNumber?.toLowerCase().includes(searchLower) ||
          l.club?.toLowerCase().includes(searchLower)
      );
    }

    // Apply column filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          const filterLower = value.toLowerCase();
          filtered = filtered.filter(l => {
            const fieldValue = l[key as keyof LicenceType];
            return String(fieldValue || '')
              .toLowerCase()
              .includes(filterLower);
          });
        }
      });
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
    return licencesData.find(l => l.id === Number(id));
  },

  create: async (licence: Omit<LicenceType, 'id'>): Promise<LicenceType> => {
    await delay();
    const newLicence: LicenceType = { ...licence, id: nextId++ };
    licencesData.push(newLicence);
    return newLicence;
  },

  update: async (id: string, updates: Partial<LicenceType>): Promise<LicenceType> => {
    await delay();
    const index = licencesData.findIndex(l => l.id === Number(id));
    if (index === -1) {
      throw new Error('Licence not found');
    }
    licencesData[index] = { ...licencesData[index], ...updates };
    return licencesData[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    licencesData = licencesData.filter(l => l.id !== Number(id));
  },
};
