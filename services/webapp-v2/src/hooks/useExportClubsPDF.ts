import type { ClubPaginationParams } from '@/types/clubs';
import { useExportFromApi } from './useExportFromApi';

export function useExportClubsPDF(params: ClubPaginationParams, totalCount: number) {
  const { doExport, isExporting } = useExportFromApi(params, totalCount, {
    endpoint: '/reports/pdf/clubs',
    filename: 'Clubs.pdf',
    entityLabel: 'clubs',
    maxCount: 1500,
  });

  return { exportPDF: doExport, isExporting };
}
