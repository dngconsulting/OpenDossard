import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
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
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const CompetitionsDataTable = ({ onEdit, onDuplicate: _onDuplicate }: CompetitionsTableProps) => {
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
      cell: ({ row }) => (
        <span className="text-center block">{row.original.engagementsCount}</span>
      ),
    },
    {
      accessorKey: 'classementsCount',
      header: 'Class.',
      size: 60,
      cell: ({ row }) => (
        <span className="text-center block">{row.original.classementsCount}</span>
      ),
    },
    {
      accessorKey: 'eventDate',
      header: 'Date',
      size: 75,
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
      cell: ({ row }) => row.original.club?.longName || '-',
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
  ];

  if (error) {
    return <div>Erreur lors du chargement des épreuves...</div>;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      onEditRow={onEdit}
      isLoading={isLoading}
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
