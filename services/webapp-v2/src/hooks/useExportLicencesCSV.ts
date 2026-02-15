import type { PaginationParams } from '@/types/licences';
import { useExportFromApi } from './useExportFromApi';

export function useExportLicencesCSV(params: PaginationParams, totalCount: number) {
  const { doExport, isExporting } = useExportFromApi(params, totalCount, {
    endpoint: '/reports/csv/licences',
    filename: () => {
      const date = new Date().toISOString().split('T')[0];
      return `licences - ${date}.csv`;
    },
    entityLabel: 'licences',
    maxCount: 1500,
  });

  return { exportCSV: doExport, isExporting };
}
