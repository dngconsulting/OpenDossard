import { clubs as initialClubs } from '@/mocks/clubs.mocks';
import type { ClubType } from '@/types/clubs';

let clubsData: ClubType[] = [...initialClubs];

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockClubsService = {
  getAll: async (): Promise<ClubType[]> => {
    await delay();
    return [...clubsData];
  },

  getByDepartment: async (department: string): Promise<ClubType[]> => {
    await delay();
    return clubsData.filter(club => club.department === department);
  },

  search: async (query: string): Promise<ClubType[]> => {
    await delay();
    const lowerQuery = query.toLowerCase();
    return clubsData.filter(club => club.name.toLowerCase().includes(lowerQuery));
  },

  getById: async (id: string): Promise<ClubType | undefined> => {
    await delay();
    return clubsData.find(c => c.id === id);
  },

  create: async (club: Omit<ClubType, 'id'>): Promise<ClubType> => {
    await delay();
    const newClub = { ...club, id: crypto.randomUUID() };
    clubsData.push(newClub);
    return newClub;
  },
};
