import { departments as initialDepartments } from '@/mocks/departments.mocks';
import type { DepartmentType } from '@/types/departments';

const departmentsData: DepartmentType[] = [...initialDepartments];

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockDepartmentsService = {
  getAll: async (): Promise<DepartmentType[]> => {
    await delay();
    return [...departmentsData];
  },

  search: async (query: string): Promise<DepartmentType[]> => {
    await delay();
    const lowerQuery = query.toLowerCase();
    return departmentsData.filter(
      dept => dept.code.includes(lowerQuery) || dept.name.toLowerCase().includes(lowerQuery)
    );
  },
};
