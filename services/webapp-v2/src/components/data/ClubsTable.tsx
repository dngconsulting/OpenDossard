import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/ui/data-table';
import { DEPT_FILTER_OPTIONS, FEDE_FILTER_OPTIONS } from '@/config/federations';
import type { ClubType } from '@/types/clubs';
import type { PaginationMeta } from '@/types/users';

const columns: ColumnDef<ClubType>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableSorting: false,
  },
  {
    accessorKey: 'fede',
    header: 'Fédé',
    size: 90,
  },
  {
    accessorKey: 'dept',
    header: 'Dépt.',
    size: 80,
  },
  {
    accessorKey: 'shortName',
    header: 'Nom court',
    size: 120,
  },
  {
    accessorKey: 'longName',
    header: 'Nom long',
    size: 300,
  },
  {
    accessorKey: 'elicenceName',
    header: 'Nom eLicence/Exalto',
    size: 300,
  },
];

type Props = {
  clubs: ClubType[];
  isLoading: boolean;
  pagination: {
    meta: PaginationMeta;
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    setLimit: (limit: number) => void;
  };
  sorting: {
    sortColumn?: string;
    sortDirection?: 'ASC' | 'DESC';
    onSortChange: (column: string, direction: 'ASC' | 'DESC') => void;
  };
  serverFilters?: Record<string, string>;
  onFilterChange?: (columnId: string, value: string) => void;
  getEditClubHref?: (club: ClubType) => string;
  onDeleteClub?: (club: ClubType) => void;
};

export const ClubsTable = ({ clubs, isLoading, pagination, sorting, serverFilters, onFilterChange, getEditClubHref, onDeleteClub }: Props) => {
  return (
    <DataTable
      columns={columns}
      data={clubs}
      isLoading={isLoading}
      serverFilters={serverFilters}
      onFilterChange={onFilterChange}
      multiSelectColumns={{
        dept: { options: DEPT_FILTER_OPTIONS },
        fede: { options: FEDE_FILTER_OPTIONS },
      }}
      getEditRowHref={getEditClubHref}
      onDeleteRow={onDeleteClub}
      pagination={{
        enabled: true,
        meta: pagination.meta,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage,
        onPageSizeChange: pagination.setLimit,
      }}
      sorting={{
        sortColumn: sorting.sortColumn,
        sortDirection: sorting.sortDirection,
        onSortChange: sorting.onSortChange,
      }}
    />
  );
};
