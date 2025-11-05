import { races as initialRaces } from '@/mocks/races.mocks';
import type { RaceType } from '@/types/races.ts';

let racesData: RaceType[] = [...initialRaces];

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockRacesService = {
  getAll: async (): Promise<RaceType[]> => {
    await delay();
    return [...racesData];
  },

  getById: async (id: string): Promise<RaceType | undefined> => {
    await delay();
    return racesData.find(r => r.id === id);
  },

  create: async (race: Omit<RaceType, 'id'>): Promise<RaceType> => {
    await delay();
    const newRace = { ...race, id: crypto.randomUUID() };
    racesData.push(newRace);
    return newRace;
  },

  update: async (id: string, updates: Partial<RaceType>): Promise<RaceType> => {
    await delay();
    const index = racesData.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Race not found');
    }
    racesData[index] = { ...racesData[index], ...updates };
    return racesData[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    racesData = racesData.filter(r => r.id !== id);
  },
};
