import { useState, useCallback } from 'react';

import type { ClubPaginationParams } from '@/types/clubs';
import { downloadFromApi } from '@/utils/download';
import { showWarningToast, handleGlobalError } from '@/utils/error-handler/error-handler';

const MAX_EXPORT_CLUBS = 1500;

interface UseExportClubsPDFResult {
  exportPDF: () => Promise<void>;
  isExporting: boolean;
}

function buildExportQueryString(params: ClubPaginationParams): string {
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

export function useExportClubsPDF(
  params: ClubPaginationParams,
  totalCount: number,
): UseExportClubsPDFResult {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = useCallback(async () => {
    if (totalCount > MAX_EXPORT_CLUBS) {
      showWarningToast(
        `Plus de ${MAX_EXPORT_CLUBS} clubs à exporter, veuillez utiliser plus de filtres.`,
      );
      return;
    }

    if (totalCount === 0) {
      showWarningToast('Aucun club à exporter.');
      return;
    }

    setIsExporting(true);

    try {
      const queryString = buildExportQueryString(params);
      await downloadFromApi(`/reports/pdf/clubs${queryString}`, 'Clubs.pdf');
    } catch (error) {
      handleGlobalError(error);
    } finally {
      setIsExporting(false);
    }
  }, [params, totalCount]);

  return { exportPDF, isExporting };
}
