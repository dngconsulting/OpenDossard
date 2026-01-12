import { dashboardData } from '@/mocks/dashboard.mocks';
import type { DashboardData } from '@/types/dashboard';

export const dashboardMockService = {
  getData: async (): Promise<DashboardData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(dashboardData);
      }, 500);
    });
  },
};
