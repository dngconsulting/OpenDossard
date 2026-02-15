import { useState, useCallback } from 'react';

import type { PaginationParams } from '@/types/licences';
import { downloadFromApi } from '@/utils/download';
import { showWarningToast, handleGlobalError } from '@/utils/error-handler/error-handler';

const MAX_EXPORT_LICENCES = 1500;

interface UseExportLicencesPDFResult {
  exportPDF: () => Promise<void>;
  isExporting: boolean;
}

function buildExportQueryString(params: PaginationParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderDirection) searchParams.set('orderDirection', params.orderDirection);
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function useExportLicencesPDF(
  params: PaginationParams,
  totalCount: number,
): UseExportLicencesPDFResult {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = useCallback(async () => {
    if (totalCount > MAX_EXPORT_LICENCES) {
      showWarningToast(
        `Plus de ${MAX_EXPORT_LICENCES} licences à exporter, veuillez utiliser plus de filtres.`,
      );
      return;
    }

    if (totalCount === 0) {
      showWarningToast('Aucune licence à exporter.');
      return;
    }

    setIsExporting(true);

    try {
      const queryString = buildExportQueryString(params);
      await downloadFromApi(`/reports/pdf/licences${queryString}`, 'Licences.pdf');
    } catch (error) {
      handleGlobalError(error);
    } finally {
      setIsExporting(false);
    }
  }, [params, totalCount]);

  return { exportPDF, isExporting };
}
