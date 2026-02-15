import type { ClubPaginationParams } from '@/types/clubs';
import { useExportFromApi } from './useExportFromApi';

export function useExportClubsCSV(params: ClubPaginationParams, totalCount: number) {
  const { doExport, isExporting } = useExportFromApi(params, totalCount, {
    endpoint: '/reports/csv/clubs',
    filename: () => {
      const date = new Date().toISOString().split('T')[0];
      return `clubs - ${date}.csv`;
    },
    entityLabel: 'clubs',
    maxCount: 1500,
  });

  return { exportCSV: doExport, isExporting };
}
