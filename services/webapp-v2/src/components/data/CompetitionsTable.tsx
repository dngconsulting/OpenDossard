import { CalendarDays, Copy } from 'lucide-react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCompetitions } from '@/hooks/useCompetitions';
import type { CompetitionType } from '@/types/competitions';

import type { ColumnDef } from '@tanstack/react-table';

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border shadow-xs">
      <div className="bg-primary/10 border-b">
        <div className="flex h-8 items-center gap-1 px-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="bg-muted/30 border-b">
        <div className="flex items-center gap-1 px-1 py-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-1 border-b px-1 py-1">
          {Array.from({ length: 10 }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      <div className="flex items-center justify-between px-2 py-2 border-t">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

type CompetitionsTableProps = {
  onEdit?: (row: CompetitionType) => void;
  onDuplicate?: (row: CompetitionType) => void;
  onDelete?: (row: CompetitionType) => void;
  onExportFiche?: (row: CompetitionType) => void;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const CompetitionsDataTable = ({ onEdit, onDuplicate, onDelete, onExportFiche }: CompetitionsTableProps) => {
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
  } = useCompetitions();

  const columns: ColumnDef<CompetitionType>[] = [
    {
      accessorKey: 'engagementsCount',
      header: 'Eng.',
      size: 60,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const count = row.original.engagementsCount;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={`/competition/${row.original.id}/engagements`}
                className="text-center block text-primary hover:underline"
              >
                {count === 0 ? 'Engager' : `${count} Eng.`}
              </Link>
            </TooltipTrigger>
            <TooltipContent>Accès aux engagements</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'classementsCount',
      header: 'Class.',
      size: 60,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const count = row.original.classementsCount;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={`/competition/${row.original.id}/classements`}
                className="text-center block text-primary hover:underline"
              >
                {count === 0 ? 'Classer' : `${count} Class.`}
              </Link>
            </TooltipTrigger>
            <TooltipContent>Accès aux classements</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'eventDate',
      header: 'Date',
      size: 75,
      enableColumnFilter: false,
      cell: ({ row }) => formatDate(row.original.eventDate),
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      size: 200,
    },
    {
      accessorKey: 'zipCode',
      header: 'Lieu',
      size: 50,
    },
    {
      accessorKey: 'club',
      header: 'Club',
      size: 180,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.club?.longName || '-'}</span>
      ),
    },
    {
      accessorKey: 'fede',
      header: 'Fédé',
      size: 70,
    },
    {
      accessorKey: 'competitionType',
      header: 'Type',
      size: 70,
    },
    ...(onDuplicate
      ? [
          {
            id: 'duplicate',
            header: '',
            size: 40,
            enableColumnFilter: false,
            cell: ({ row }: { row: { original: CompetitionType } }) => (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onDuplicate(row.original)}
                title="Dupliquer"
              >
                <Copy />
              </Button>
            ),
          } satisfies ColumnDef<CompetitionType>,
        ]
      : []),
    ...(onExportFiche
      ? [
          {
            id: 'exportFiche',
            header: '',
            size: 40,
            enableColumnFilter: false,
            cell: ({ row }: { row: { original: CompetitionType } }) =>
              row.original.fede === 'FSGT' ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onExportFiche(row.original)}
                  title="Fiche épreuve PDF"
                >
                  <img src="/logo/pdf-download.svg" alt="PDF" className="h-5 w-5" />
                </Button>
              ) : null,
          } satisfies ColumnDef<CompetitionType>,
        ]
      : []),
  ];

  const competitions = data?.data || [];
  const todayTs = new Date().setHours(0, 0, 0, 0);

  const renderBeforeRow = useCallback((row: CompetitionType, index: number) => {
    const rowDate = new Date(row.eventDate).setHours(0, 0, 0, 0);
    if (rowDate >= todayTs) return null;
    // Insert only if this is the first past row (previous row is future or this is the first row)
    const prevRow = competitions[index - 1];
    if (prevRow && new Date(prevRow.eventDate).setHours(0, 0, 0, 0) < todayTs) return null;
    return (
      <TableRow className="bg-muted/50 hover:bg-muted/50 border-y-2 border-primary/30">
        <TableCell colSpan={10} className="py-1.5 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary/70">
            <CalendarDays className="h-4 w-4" />
            Aujourd&apos;hui
          </span>
        </TableCell>
      </TableRow>
    );
  }, [todayTs, competitions]);

  if (error) {
    return <div>Erreur lors du chargement des épreuves...</div>;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <DataTable
      columns={columns}
      data={competitions}
      onEditRow={onEdit}
      onDeleteRow={onDelete}
      isLoading={isLoading}
      renderBeforeRow={renderBeforeRow}
      serverFilters={(params.filters as Record<string, string>) || {}}
      onFilterChange={(columnId, value) => setFilter(columnId as keyof CompetitionType, value)}
      sorting={{
        sortColumn: params.orderBy,
        sortDirection: params.orderDirection,
        onSortChange: setSort,
      }}
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
  );
};
