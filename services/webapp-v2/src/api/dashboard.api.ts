import { isMockMode } from '@/config/api.config';
import { dashboardMockService } from '@/services/mocks/dashboard.mock.service';
import type { DashboardData } from '@/types/dashboard';

import { apiClient } from './client';

const realDashboardService = {
  getData: (): Promise<DashboardData> => apiClient<DashboardData>('/dashboard'),
};

export const dashboardApi = isMockMode('dashboard') ? dashboardMockService : realDashboardService;
