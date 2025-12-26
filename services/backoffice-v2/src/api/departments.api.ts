import { isMockMode } from '@/config/api.config';
import { mockDepartmentsService } from '@/services/mocks/departments.mock.service';
import type { DepartmentType } from '@/types/departments';

import { apiClient } from './client';

const realDepartmentsService = {
  getAll: (): Promise<DepartmentType[]> => apiClient<DepartmentType[]>('/departments'),

  search: (query: string): Promise<DepartmentType[]> =>
    apiClient<DepartmentType[]>(`/departments?search=${encodeURIComponent(query)}`),
};

export const departmentsApi = isMockMode('departments')
  ? mockDepartmentsService
  : realDepartmentsService;
