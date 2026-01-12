import { engagementChartData, type EngagementChartData } from '@/mocks/charts.mocks';

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const mockChartsService = {
  getEngagementData: async (): Promise<EngagementChartData[]> => {
    await delay();
    return [...engagementChartData];
  },
};
