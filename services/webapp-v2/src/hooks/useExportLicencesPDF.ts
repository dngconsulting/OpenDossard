import { useState, useCallback } from 'react';

import { licencesApi } from '@/api/licences.api';
import type { LicenceType, PaginationParams } from '@/types/licences';
import { licencesPDF } from '@/utils/pdf/licences-pdf';
import { showWarningToast, handleGlobalError } from '@/utils/error-handler/error-handler';

const MAX_EXPORT_LICENCES = 1500;
const API_PAGE_SIZE = 100; // Backend limit

interface UseExportLicencesPDFResult {
  exportPDF: () => Promise<void>;
  isExporting: boolean;
}

/**
 * Fetches all licences matching the filters by paginating through results
 * @param params - Filter parameters (without pagination)
 * @param totalCount - Total count to fetch
 */
async function fetchAllLicences(
  params: PaginationParams,
  totalCount: number
): Promise<LicenceType[]> {
  const allLicences: LicenceType[] = [];
  const totalPages = Math.ceil(Math.min(totalCount, MAX_EXPORT_LICENCES) / API_PAGE_SIZE);

  for (let page = 0; page < totalPages; page++) {
    const response = await licencesApi.getAll({
      ...params,
      offset: page * API_PAGE_SIZE,
      limit: API_PAGE_SIZE,
    });
    allLicences.push(...response.data);
  }

  return allLicences;
}

/**
 * Hook to export filtered licences to PDF
 * @param params - Current pagination/filter parameters from useLicences
 * @param totalCount - Total count of licences matching the filter
 */
export function useExportLicencesPDF(
  params: PaginationParams,
  totalCount: number
): UseExportLicencesPDFResult {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = useCallback(async () => {
    // Check if export is allowed based on count
    if (totalCount > MAX_EXPORT_LICENCES) {
      showWarningToast(
        `Plus de ${MAX_EXPORT_LICENCES} licences \u00e0 exporter, veuillez utiliser plus de filtres.`
      );
      return;
    }

    if (totalCount === 0) {
      showWarningToast('Aucune licence \u00e0 exporter.');
      return;
    }

    setIsExporting(true);

    try {
      // Fetch all licences matching the current filters (paginated to respect API limit)
      const allLicences = await fetchAllLicences(params, totalCount);
      licencesPDF(allLicences);
    } catch (error) {
      handleGlobalError(error);
    } finally {
      setIsExporting(false);
    }
  }, [params, totalCount]);

  return { exportPDF, isExporting };
}
