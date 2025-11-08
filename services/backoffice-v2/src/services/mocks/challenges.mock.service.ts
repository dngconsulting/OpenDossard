import type { ChallengeTableType } from '@/components/data/ChallengeTable';
import { challenge as initialChallenges } from '@/mocks/challenges.mocks';

let challengesData: ChallengeTableType[] = [...initialChallenges];

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockChallengesService = {
  getAll: async (): Promise<ChallengeTableType[]> => {
    await delay();
    return [...challengesData];
  },

  getById: async (id: string): Promise<ChallengeTableType | undefined> => {
    await delay();
    return challengesData.find(c => c.id === id);
  },

  create: async (challenge: Omit<ChallengeTableType, 'id'>): Promise<ChallengeTableType> => {
    await delay();
    const newChallenge = { ...challenge, id: crypto.randomUUID() };
    challengesData.push(newChallenge);
    return newChallenge;
  },

  update: async (id: string, updates: Partial<ChallengeTableType>): Promise<ChallengeTableType> => {
    await delay();
    const index = challengesData.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Challenge entry not found');
    }
    challengesData[index] = { ...challengesData[index], ...updates };
    return challengesData[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    challengesData = challengesData.filter(c => c.id !== id);
  },
};
