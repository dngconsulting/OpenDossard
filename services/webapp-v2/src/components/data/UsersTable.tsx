import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/ui/data-table';
import { RolesMultiSelect } from '@/components/ui/roles-multi-select';
import type { UserType, PaginationMeta } from '@/types/users';

type ColumnsProps = {
  onRolesChange?: (userId: number, roles: string) => void;
};

const createColumns = ({ onRolesChange }: ColumnsProps): ColumnDef<UserType>[] => [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'firstName',
    header: 'Prénom',
  },
  {
    accessorKey: 'lastName',
    header: 'Nom',
  },
  {
    accessorKey: 'phone',
    header: 'Téléphone',
    size: 140,
  },
  {
    accessorKey: 'roles',
    header: 'Rôles',
    size: 180,
    cell: ({ row }) => (
      <RolesMultiSelect
        roles={row.original.roles}
        onChange={onRolesChange ? roles => onRolesChange(row.original.id, roles) : undefined}
        disabled={!onRolesChange}
      />
    ),
  },
];

type Props = {
  users: UserType[];
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
  onRolesChange?: (userId: number, roles: string) => void;
};

export const UsersTable = ({ users, isLoading, pagination, sorting, onRolesChange }: Props) => {
  const columns = createColumns({ onRolesChange });

  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      showColumnFilters={false}
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
