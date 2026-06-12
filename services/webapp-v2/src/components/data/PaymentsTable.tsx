import { Loader2, RefreshCw } from 'lucide-react';

import { PaymentsSummaryHeader } from '@/components/common/PaymentsSummaryHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEPT_FILTER_OPTIONS } from '@/config/federations';
import { usePayments } from '@/hooks/usePayments';
import { useRefreshPaymentStatus } from '@/hooks/useRefreshPaymentStatus';
import {
  PAYMENT_STATUS_META,
  type PaymentAdminRow,
  type PaymentFilters,
  type PaymentsScope,
  type PaymentStatus,
} from '@/types/payments';

import type { ColumnDef } from '@tanstack/react-table';

const CURRENCY_EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const DATE_FR = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const DATETIME_FR = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function TableSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <div className="overflow-hidden rounded-md border shadow-xs">
      <div className="bg-primary/10 border-b">
        <div className="flex h-8 items-center gap-1 px-1">
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="bg-muted/30 border-b">
        <div className="flex items-center gap-1 px-1 py-1">
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={i} className="h-7 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-1 border-b px-1 py-1">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return <Badge className={meta.fillClassName}>{meta.label}</Badge>;
}

/**
 * Bouton "rafraîchir le statut" affiché uniquement sur les rows `pending`.
 * Déclenche `POST /helloasso/payments/admin/:id/refresh-status` qui interroge
 * HelloAsso pour rapatrier l'état réel (cf. `useRefreshPaymentStatus`).
 * Désactivé pendant la mutation (spinner inline).
 */
function RefreshStatusButton({ paymentId }: { paymentId: number }) {
  const mutation = useRefreshPaymentStatus();
  const isLoading = mutation.isPending && mutation.variables === paymentId;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLoading}
            onClick={e => {
              e.stopPropagation();
              mutation.mutate(paymentId);
            }}
            aria-label="Rafraîchir le statut depuis HelloAsso"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Re-synchroniser depuis HelloAsso</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatAmount(cents: number): string {
  return CURRENCY_EUR.format(cents);
}

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) {
    return '-';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '-';
  }
  return withTime ? DATETIME_FR.format(d) : DATE_FR.format(d);
}

function formatPersonName(first: string | null, last: string | null): string {
  const parts = [first, last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '-';
}

const STATUS_OPTIONS = (
  Object.entries(PAYMENT_STATUS_META) as [PaymentStatus, { label: string }][]
).map(([value, meta]) => ({ value, label: meta.label }));

const GENDER_OPTIONS = [
  { value: 'H', label: 'H' },
  { value: 'F', label: 'F' },
];

type PaymentsTableProps = {
  scope: PaymentsScope;
  /** Tableau pleine page : remplit la hauteur disponible (cf. DataTable.fillHeight) */
  fillHeight?: boolean;
};

export function PaymentsTable({ scope, fillHeight = false }: PaymentsTableProps) {
  const {
    data,
    isLoading,
    error,
    goToPage,
    setLimit,
    setFilter,
    setSort,
    params,
    currentPage,
    totalPages,
  } = usePayments(scope);

  const showCompetitionColumns = scope.kind === 'all';

  const columns: ColumnDef<PaymentAdminRow>[] = [];

  if (showCompetitionColumns) {
    columns.push(
      {
        accessorKey: 'competitionName',
        header: 'Compétition',
        size: 180,
        cell: ({ row }) => (
          <span className="truncate" title={row.original.competitionName ?? undefined}>
            {row.original.competitionName ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'competitionDate',
        header: 'Date comp.',
        size: 110,
        cell: ({ row }) => formatDate(row.original.competitionDate),
      },
    );
  }

  columns.push(
    // --- Bloc financier (paiement) ---
    {
      accessorKey: 'status',
      header: 'Statut',
      size: 100,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      size: 40,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) =>
        row.original.checkoutIntentId ? (
          <RefreshStatusButton paymentId={row.original.id} />
        ) : null,
    },
    {
      accessorKey: 'licenceName',
      header: 'Participant',
      size: 160,
      cell: ({ row }) => (
        <span title={formatPersonName(row.original.licenceFirstName, row.original.licenceName)}>
          {formatPersonName(row.original.licenceFirstName, row.original.licenceName)}
        </span>
      ),
    },
    {
      accessorKey: 'paidAt',
      header: 'Payé le',
      size: 130,
      enableColumnFilter: false,
      cell: ({ row }) => formatDate(row.original.paidAt, true),
    },
    {
      accessorKey: 'createdAt',
      header: 'Créé le',
      size: 130,
      enableColumnFilter: false,
      cell: ({ row }) => formatDate(row.original.createdAt, true),
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      size: 100,
      cell: ({ row }) => (
        <span className="block text-right font-medium tabular-nums">
          {formatAmount(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'tarifId',
      header: 'Tarif',
      size: 120,
      cell: ({ row }) => (
        <span className="truncate" title={row.original.tarifId}>
          {row.original.tarifId}
        </span>
      ),
    },
    {
      accessorKey: 'payerName',
      header: 'Payeur',
      size: 150,
      cell: ({ row }) => formatPersonName(row.original.payerFirstName, row.original.payerLastName),
    },
    {
      accessorKey: 'checkoutIntentId',
      header: 'N° demande',
      size: 110,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.checkoutIntentId ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'orderId',
      header: 'N° commande',
      size: 110,
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.orderId ?? '-'}</span>,
    },
    {
      accessorKey: 'paymentId',
      header: 'N° transaction',
      size: 110,
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.paymentId ?? '-'}</span>,
    },
    // --- Bloc licence (coureur engagé) ---
    {
      accessorKey: 'riderNumber',
      header: 'Dossard',
      size: 80,
      cell: ({ row }) => {
        const n = row.original.riderNumber;
        return n == null ? '-' : String(n).padStart(3, '0');
      },
    },
    {
      accessorKey: 'club',
      header: 'Club',
      size: 180,
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate" title={row.original.club ?? undefined}>
          {row.original.club ?? '-'}
        </span>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'H/F',
      size: 60,
      cell: ({ row }) => (
        <Badge variant={row.original.gender === 'F' ? 'secondary' : 'outline'}>
          {row.original.gender ?? '-'}
        </Badge>
      ),
    },
    {
      accessorKey: 'dept',
      header: 'Dept',
      size: 80,
      cell: ({ row }) => <span className="block text-center">{row.original.dept ?? '-'}</span>,
    },
    {
      accessorKey: 'birthYear',
      header: 'Année',
      size: 80,
      cell: ({ row }) => row.original.birthYear ?? '-',
    },
    {
      accessorKey: 'catea',
      header: 'Cat.A',
      size: 70,
      cell: ({ row }) => <span className="block text-center">{row.original.catea ?? '-'}</span>,
    },
    {
      accessorKey: 'catev',
      header: 'Cat.V',
      size: 70,
      cell: ({ row }) => <span className="block text-center">{row.original.catev ?? '-'}</span>,
    },
    {
      accessorKey: 'fede',
      header: 'Fédé',
      size: 90,
      cell: ({ row }) => <Badge variant="outline">{row.original.fede ?? '-'}</Badge>,
    },
  );

  if (error) {
    return <div>Erreur lors du chargement des paiements...</div>;
  }

  if (isLoading) {
    return <TableSkeleton columnCount={columns.length} />;
  }

  return (
    // Wrapper ciblant UNIQUEMENT la 1ère et la dernière row de la tbody :
    //  - `:first-child td` → pt-3 (air entre filter row sticky et 1ère data row)
    //  - `:last-child td` → pb-3 (air entre dernière data row et scrollbar
    //    horizontale du conteneur overflow-auto)
    // Pas de padding inter-rows (densité préservée). Scope local — n'affecte
    // pas les autres tables qui consomment `DataTable`.
    <div
      className={`[&_tbody_tr:first-child_td]:pt-3 [&_tbody_tr:last-child_td]:pb-3 ${
        fillHeight ? 'flex-1 min-h-0 flex flex-col' : ''
      }`}
    >
      {scope.kind === 'competition' && data?.summary && (
        <PaymentsSummaryHeader summary={data.summary} />
      )}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        fillHeight={fillHeight}
        serverFilters={(params.filters as Record<string, string>) || {}}
        multiSelectColumns={{
          gender: { options: GENDER_OPTIONS },
          dept: { options: DEPT_FILTER_OPTIONS },
          status: { options: STATUS_OPTIONS },
        }}
        onFilterChange={(columnId, value) => setFilter(columnId as keyof PaymentFilters, value)}
        sorting={{
          sortColumn: params.orderBy,
          sortDirection: params.orderDirection,
          onSortChange: setSort,
        }}
        // Coureur engagé (race row existante) → ligne grisée pour signaler
        // visuellement le statut "déjà inscrit sur cette compet". `opacity`
        // est theme-agnostic (fonctionne identique en light/dark).
        //
        // Scope `all` : la sémantique "engagé" perd son sens (chaque ligne
        // pointe vers une compétition différente — un coureur engagé sur la
        // compet A n'a aucune raison d'apparaître grisé quand on regarde la
        // vue globale). On désactive le dim dans ce scope.
        rowClassName={
          scope.kind === 'competition'
            ? row => (row.raceCode != null ? 'opacity-60' : undefined)
            : undefined
        }
        pagination={
          data?.meta
            ? {
                enabled: true,
                meta: data.meta,
                onPageChange: goToPage,
                onPageSizeChange: setLimit,
                currentPage,
                totalPages,
              }
            : undefined
        }
      />
    </div>
  );
}
