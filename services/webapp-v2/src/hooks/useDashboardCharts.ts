import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import type { DashboardChartFilters } from '@/types/dashboard';

export function useRidersPerCompetition(filters: DashboardChartFilters) {
  return useQuery({
    queryKey: ['dashboard', 'riders-per-competition', filters],
    queryFn: () => dashboardApi.getRidersPerCompetition(filters),
  });
}

export function useClubParticipation(filters: DashboardChartFilters) {
  return useQuery({
    queryKey: ['dashboard', 'club-participation', filters],
    queryFn: () => dashboardApi.getClubParticipation(filters),
  });
}

export function useCateaDistribution(filters: DashboardChartFilters) {
  return useQuery({
    queryKey: ['dashboard', 'catea-distribution', filters],
    queryFn: () => dashboardApi.getCateaDistribution(filters),
  });
}

export function useCatevDistribution(filters: DashboardChartFilters) {
  return useQuery({
    queryKey: ['dashboard', 'catev-distribution', filters],
    queryFn: () => dashboardApi.getCatevDistribution(filters),
  });
}

export function useTopRiders(filters: DashboardChartFilters) {
  return useQuery({
    queryKey: ['dashboard', 'top-riders', filters],
    queryFn: () => dashboardApi.getTopRiders(filters),
  });
}
