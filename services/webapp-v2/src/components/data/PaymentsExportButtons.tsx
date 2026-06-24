import { FileText, Loader2, Sheet } from 'lucide-react';
import { useState } from 'react';

import { paymentsApi } from '@/api/payments.api';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PaymentAdminRow, PaymentPaginationParams, PaymentsScope } from '@/types/payments';
import { showErrorToast, showInfoToast, showWarningToast } from '@/utils/error-handler/error-handler';
import { exportPaymentsCsv, exportPaymentsPdf } from '@/utils/payments-exports';

/**
 * Borne du fetch d'export : on récupère la liste complète filtrée (pas
 * seulement la page affichée) en un seul appel. Au-delà, on prévient
 * l'utilisateur d'une troncature plutôt que de tronquer silencieusement.
 */
const EXPORT_MAX = 5000;

type ExportFormat = 'pdf' | 'csv';

type PaymentsExportButtonsProps = {
  scope: PaymentsScope;
  /** Filtres + tri courants de la grid (réutilisés pour récupérer toute la liste). */
  params: PaymentPaginationParams;
  /** Nombre total de paiements (filtres appliqués) : désactive l'export si 0. */
  total: number;
};

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'paiements'
  );
}

function buildExportMeta(scope: PaymentsScope, rows: PaymentAdminRow[]) {
  if (scope.kind === 'competition') {
    const name = rows[0]?.competitionName ?? 'Paiements';
    return { title: `Paiements — ${name}`, filename: `paiements-${slugify(name)}` };
  }
  return { title: 'Tous les paiements', filename: 'paiements-tous' };
}

/**
 * Boutons d'export PDF + CSV de la liste des paiements HelloAsso.
 *
 * Réutilisable par l'onglet HelloAsso d'une épreuve (scope `competition`) et
 * par l'écran « tous les paiements » admin (scope `all`). Chaque export
 * récupère la liste complète correspondant aux filtres actifs (cf. `params`),
 * puis délègue le rendu au service `payments-exports`.
 */
export function PaymentsExportButtons({ scope, params, total }: PaymentsExportButtonsProps) {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const disabled = total === 0 || loadingFormat !== null;

  const handleExport = async (format: ExportFormat) => {
    setLoadingFormat(format);
    try {
      const response = await paymentsApi.list(scope, {
        ...params,
        offset: 0,
        limit: EXPORT_MAX,
      });
      const rows = response.data;

      if (rows.length === 0) {
        showInfoToast('Export', 'Aucun paiement à exporter.');
        return;
      }

      const { title, filename } = buildExportMeta(scope, rows);
      if (format === 'pdf') {
        await exportPaymentsPdf(rows, { scope, title, filename });
      } else {
        exportPaymentsCsv(rows, { scope, filename });
      }

      if (response.meta.total > rows.length) {
        showWarningToast(
          'Export partiel',
          `Seuls les ${rows.length} premiers paiements (sur ${response.meta.total}) ont été exportés. Affinez les filtres pour réduire la liste.`,
        );
      }
    } catch {
      showErrorToast('Export', "L'export des paiements a échoué.");
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-2 pb-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => void handleExport('pdf')}
            >
              {loadingFormat === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-red-600" />
              )}
              PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exporter la liste des paiements en PDF</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => void handleExport('csv')}
            >
              {loadingFormat === 'csv' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sheet className="h-4 w-4 text-green-600" />
              )}
              CSV
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exporter la liste des paiements en CSV (Excel)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
