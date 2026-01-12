import { licences as initialLicences } from '@/mocks/licences.mocks';
import type { LicenceType } from '@/types/licences';

let licencesData: LicenceType[] = [...initialLicences];

const delay = () => new Promise(resolve => setTimeout(resolve, 1200));

export const mockLicencesService = {
  getAll: async (): Promise<LicenceType[]> => {
    await delay();
    return [...licencesData];
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
