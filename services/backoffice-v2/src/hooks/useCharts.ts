import { useQuery } from '@tanstack/react-query';

import { chartsApi } from '@/api/charts.api';

export const chartsKeys = {
  engagement: ['charts', 'engagement'] as const,
  licences: ['charts', 'licences'] as const,
  races: ['charts', 'races'] as const,
  racesType: ['charts', 'races-type'] as const,
};

export function useEngagementChart() {
  return useQuery({
    queryKey: chartsKeys.engagement,
    queryFn: () => chartsApi.getEngagementData(),
  });
}
