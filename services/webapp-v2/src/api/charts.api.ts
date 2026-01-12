import { isMockMode } from '@/config/api.config';
import type { EngagementChartData } from '@/mocks/charts.mocks';
import { mockChartsService } from '@/services/mocks/charts.mock.service';

import { apiClient } from './client';

const realChartsService = {
  getEngagementData: (): Promise<EngagementChartData[]> =>
    apiClient<EngagementChartData[]>('/charts/engagement'),
};

export const chartsApi = isMockMode('charts') ? mockChartsService : realChartsService;
