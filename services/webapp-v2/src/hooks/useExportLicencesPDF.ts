import type { PaginationParams } from '@/types/licences';
import { useExportFromApi } from './useExportFromApi';

export function useExportLicencesPDF(params: PaginationParams, totalCount: number) {
  const { doExport, isExporting } = useExportFromApi(params, totalCount, {
    endpoint: '/reports/pdf/licences',
    filename: 'Licences.pdf',
    entityLabel: 'licences',
    maxCount: 1500,
  });

  return { exportPDF: doExport, isExporting };
}
