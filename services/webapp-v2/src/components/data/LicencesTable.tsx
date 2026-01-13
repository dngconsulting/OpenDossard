import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/ui/data-table.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { useLicences } from '@/hooks/useLicences';
import type { LicenceType } from '@/types/licences.ts';

import type { ColumnDef } from '@tanstack/react-table';

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border shadow-xs">
      {/* Header */}
      <div className="bg-primary/10 border-b">
        <div className="flex h-10 items-center gap-2 px-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Filter row */}
      <div className="bg-muted/30 border-b">
        <div className="flex items-center gap-2 px-2 py-1.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
      </div>
      {/* Body rows */}
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-2 border-b px-2 py-3">
          {Array.from({ length: 14 }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
          {/* Action buttons */}
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

type LicenceTableProps = {
  onEdit?: (row: LicenceType) => void;
  onDelete?: (row: LicenceType) => void;
};

export const LicencesDataTable = ({ onEdit, onDelete }: LicenceTableProps) => {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error,
    goToPage,
    setLimit,
    currentPage,
    totalPages,
  } = useLicences({ offset: 0, limit: 20 });

  const columns: ColumnDef<LicenceType>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'licenceNumber',
      header: 'Lic. N°',
    },
    {
      accessorKey: 'name',
      header: 'Nom',
    },
    {
      accessorKey: 'firstName',
      header: 'Prénom',
    },
    {
      accessorKey: 'club',
      header: 'Club',
    },
    {
      accessorKey: 'gender',
      header: 'H/F',
    },
    {
      accessorKey: 'dept',
      header: 'Dept',
    },
    {
      accessorKey: 'birthYear',
      header: 'Année',
    },
    {
      accessorKey: 'catea',
      header: 'Caté.A',
    },
    {
      accessorKey: 'catev',
      header: 'Caté.V',
    },
    {
      accessorKey: 'catevCX',
      header: 'Caté.CX',
    },
    {
      accessorKey: 'fede',
      header: 'Fédé',
    },
    {
      accessorKey: 'saison',
      header: 'Saison',
    },
    {
      accessorKey: 'comment',
      header: 'Com.',
      cell: ({ row }) => (row.original.comment ? 'O' : 'N'),
    },
  ];

  if (error) {
    return <div>Error loading licences</div>;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      onEditRow={onEdit}
      onDeleteRow={onDelete}
      onOpenRow={(row) => navigate(`/palmares/${row.id}`)}
      isLoading={isLoading}
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
