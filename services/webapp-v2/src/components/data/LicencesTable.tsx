import { MessageCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table.tsx';
import type { MultiSelectOption } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLicences } from '@/hooks/useLicences';
import type { LicenceType } from '@/types/licences.ts';

import type { ColumnDef } from '@tanstack/react-table';

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border shadow-xs">
      {/* Header */}
      <div className="bg-primary/10 border-b">
        <div className="flex h-8 items-center gap-1 px-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Filter row */}
      <div className="bg-muted/30 border-b">
        <div className="flex items-center gap-1 px-1 py-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-7 flex-1" />
          ))}
        </div>
      </div>
      {/* Body rows */}
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-1 border-b px-1 py-1">
          {Array.from({ length: 14 }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
          {/* Action buttons */}
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      ))}
      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-2 border-t">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

const DEPT_OPTIONS: MultiSelectOption[] = [
  ...Array.from({ length: 19 }, (_, i) => {
    const code = String(i + 1).padStart(2, '0');
    return { value: code, label: code };
  }),
  { value: '2A', label: '2A' },
  { value: '2B', label: '2B' },
  ...Array.from({ length: 75 }, (_, i) => {
    const code = String(i + 21).padStart(2, '0');
    return { value: code, label: code };
  }),
  ...['971', '972', '973', '974', '976'].map(c => ({ value: c, label: c })),
];

type LicenceTableProps = {
  onEdit?: (row: LicenceType) => void;
  onDelete?: (row: LicenceType) => void;
};

export const LicencesDataTable = ({ onEdit, onDelete }: LicenceTableProps) => {
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
  } = useLicences();

  const columns: ColumnDef<LicenceType>[] = [
    {
      id: 'racesCount',
      header: '',
      size: 40,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const count = row.original.racesCount ?? 0;
        if (count === 0) return null;
        return (
          <Link
            to={`/palmares/${row.original.id}`}
            className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
            title="Palmarès"
          >
            <Trophy />
          </Link>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'ID',
      size: 70,
    },
    {
      accessorKey: 'fede',
      header: 'Fédé',
      size: 90,
    },
    {
      accessorKey: 'licenceNumber',
      header: 'Lic. N°',
      size: 90,
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      size: 90,
    },
    {
      accessorKey: 'firstName',
      header: 'Prénom',
      size: 90,
    },
    {
      accessorKey: 'club',
      header: 'Club',
      size: 200,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.club || '-'}</span>,
    },
    {
      accessorKey: 'gender',
      header: 'G',
      size: 50,
      cell: ({ row }) => (
        <Badge variant={row.original.gender === 'F' ? 'secondary' : 'outline'}>
          {row.original.gender || '-'}
        </Badge>
      ),
    },
    {
      accessorKey: 'dept',
      header: 'Dept',
      size: 100,
      cell: ({ row }) => <span className="block text-center">{row.original.dept || '-'}</span>,
    },
    {
      accessorKey: 'birthYear',
      header: 'Année',
      size: 80,
    },
    {
      accessorKey: 'catea',
      header: 'Cat.A',
      size: 80,
      cell: ({ row }) => <span className="block text-center">{row.original.catea || '-'}</span>,
    },
    {
      accessorKey: 'catev',
      header: 'Cat.V',
      size: 80,
      cell: ({ row }) => <span className="block text-center">{row.original.catev || '-'}</span>,
    },
    {
      accessorKey: 'catevCX',
      header: 'CX',
      size: 80,
      cell: ({ row }) => <span className="block text-center">{row.original.catevCX || '-'}</span>,
    },
    {
      accessorKey: 'saison',
      header: 'Saison',
      size: 90,
    },
    {
      accessorKey: 'comment',
      header: 'Com.',
      size: 50,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const comment = row.original.comment;
        if (!comment) return <span className="block text-center text-muted-foreground">-</span>;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block text-center cursor-pointer">
                <MessageCircle className="inline h-4 w-4 text-primary" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{comment}</TooltipContent>
          </Tooltip>
        );
      },
    },
  ];

  if (error) {
    return <div>Erreur lors du chargement des licences...</div>;
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
      isLoading={isLoading}
      serverFilters={(params.filters as Record<string, string>) || {}}
      multiSelectColumns={{ dept: { options: DEPT_OPTIONS } }}
      onFilterChange={(columnId, value) => setFilter(columnId as keyof LicenceType, value)}
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
