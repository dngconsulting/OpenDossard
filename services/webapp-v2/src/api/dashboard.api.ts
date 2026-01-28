import { isMockMode } from '@/config/api.config';
import { dashboardMockService } from '@/services/mocks/dashboard.mock.service';
import type {
  DashboardData,
  DashboardChartFilters,
  RidersPerCompetitionItem,
  ClubParticipationItem,
  CateaDistributionItem,
  CatevDistributionItem,
  TopRiderItem,
} from '@/types/dashboard';

import { apiClient } from './client';

function buildChartQueryString(filters: DashboardChartFilters): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  filters.fedes?.forEach(v => params.append('fedes', v));
  filters.competitionTypes?.forEach(v => params.append('competitionTypes', v));
  filters.competitionDepts?.forEach(v => params.append('competitionDepts', v));
  filters.riderDepts?.forEach(v => params.append('riderDepts', v));
  filters.clubs?.forEach(v => params.append('clubs', v));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

const realDashboardService = {
  getData: (): Promise<DashboardData> => apiClient<DashboardData>('/dashboard'),

  getRidersPerCompetition: (filters: DashboardChartFilters): Promise<RidersPerCompetitionItem[]> =>
    apiClient<RidersPerCompetitionItem[]>(`/dashboard/charts/riders-per-competition${buildChartQueryString(filters)}`),

  getClubParticipation: (filters: DashboardChartFilters): Promise<ClubParticipationItem[]> =>
    apiClient<ClubParticipationItem[]>(`/dashboard/charts/club-participation${buildChartQueryString(filters)}`),

  getCateaDistribution: (filters: DashboardChartFilters): Promise<CateaDistributionItem[]> =>
    apiClient<CateaDistributionItem[]>(`/dashboard/charts/catea-distribution${buildChartQueryString(filters)}`),

  getCatevDistribution: (filters: DashboardChartFilters): Promise<CatevDistributionItem[]> =>
    apiClient<CatevDistributionItem[]>(`/dashboard/charts/catev-distribution${buildChartQueryString(filters)}`),

  getTopRiders: (filters: DashboardChartFilters): Promise<TopRiderItem[]> =>
    apiClient<TopRiderItem[]>(`/dashboard/charts/top-riders${buildChartQueryString(filters)}`),
};

export const dashboardApi = isMockMode('dashboard') ? { ...dashboardMockService, ...realDashboardService } : realDashboardService;
