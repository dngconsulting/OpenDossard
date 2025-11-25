import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/api/dashboard.api';
import type { DashboardData } from '@/types/dashboard';

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getData(),
  });
};
