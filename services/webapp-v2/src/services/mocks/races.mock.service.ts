import { races as initialRaces } from '@/mocks/races.mocks';
import type { RaceType, EngagedRider, RaceResult } from '@/types/races.ts';

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

export const addEngagedRiderMock = (
  raceId: string,
  categoryId: string,
  rider: Omit<EngagedRider, 'id'>
): Promise<EngagedRider> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newRider: EngagedRider = {
        ...rider,
        id: `er${Date.now()}`,
      };

      const race = racesData.find(r => r.id === raceId);
      const category = race?.categories.find(c => c.id === categoryId);
      if (category) {
        category.engagedRiders.push(newRider);
        race!.engagedCount = race!.engagedCount + 1;
      }

      resolve(newRider);
    }, 500);
  });
};

export const removeEngagedRiderMock = (
  raceId: string,
  categoryId: string,
  riderId: string
): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const race = racesData.find(r => r.id === raceId);
      const category = race?.categories.find(c => c.id === categoryId);
      if (category) {
        const index = category.engagedRiders.findIndex(r => r.id === riderId);
        if (index !== -1) {
          category.engagedRiders.splice(index, 1);
          race!.engagedCount = race!.engagedCount - 1;
        }
      }
      resolve();
    }, 500);
  });
};

export const updateResultsRankingsMock = (
  raceId: string,
  categoryId: string,
  resultIds: string[]
): Promise<RaceResult[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const race = racesData.find(r => r.id === raceId);
      const category = race?.categories.find(c => c.id === categoryId);
      if (category) {
        // Reorder results based on the new order and update ranks
        const reorderedResults = resultIds
          .map((id, index) => {
            const result = category.results.find(r => r.id === id);
            if (result) {
              result.rank = index + 1;
            }
            return result;
          })
          .filter((r): r is RaceResult => r !== undefined);

        category.results = reorderedResults;
        resolve(reorderedResults);
      } else {
        resolve([]);
      }
    }, 500);
  });
};
