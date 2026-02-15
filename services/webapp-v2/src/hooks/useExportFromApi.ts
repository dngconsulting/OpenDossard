import { useState, useCallback } from 'react';
import { downloadFromApi } from '@/utils/download';
import { showWarningToast, handleGlobalError } from '@/utils/error-handler';

type ExportableParams = {
  search?: string;
  orderBy?: string;
  orderDirection?: string;
  filters?: Record<string, string | undefined>;
};

function buildExportQueryString(params: ExportableParams): string {
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

interface ExportConfig {
  endpoint: string;
  filename: string | (() => string);
  entityLabel: string;
  maxCount: number;
}

export function useExportFromApi(
  params: ExportableParams,
  totalCount: number,
  config: ExportConfig,
) {
  const [isExporting, setIsExporting] = useState(false);

  const doExport = useCallback(async () => {
    if (totalCount > config.maxCount) {
      showWarningToast(
        `Plus de ${config.maxCount} ${config.entityLabel} à exporter, veuillez utiliser plus de filtres.`,
      );
      return;
    }
    if (totalCount === 0) {
      showWarningToast(`Aucun(e) ${config.entityLabel} à exporter.`);
      return;
    }

    setIsExporting(true);
    try {
      const qs = buildExportQueryString(params);
      const filename = typeof config.filename === 'function' ? config.filename() : config.filename;
      await downloadFromApi(`${config.endpoint}${qs}`, filename);
    } catch (error) {
      handleGlobalError(error);
    } finally {
      setIsExporting(false);
    }
  }, [params, totalCount, config]);

  return { doExport, isExporting };
}
