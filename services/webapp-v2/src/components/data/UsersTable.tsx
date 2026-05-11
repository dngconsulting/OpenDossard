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
    header: 'Email / Identifiant',
    cell: ({ row }) => {
      const user = row.original;
      // Pour les users firebase, l'email n'est pas persisté côté backend.
      // On affiche le firebase_uid (identifiant unique Firebase) à la place,
      // en monospace pour signaler qu'il s'agit d'un identifiant technique.
      if (user.firebaseUid) {
        return (
          <span
            className="font-mono text-xs text-muted-foreground"
            title="Identifiant Firebase Auth (utilisateur mobile)"
          >
            {user.firebaseUid}
          </span>
        );
      }
      return user.email ?? '—';
    },
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
    cell: ({ row }) => {
      const isReadOnly = Boolean(row.original.firebaseUid);
      return (
        <RolesMultiSelect
          roles={row.original.roles}
          onChange={
            onRolesChange && !isReadOnly
              ? roles => onRolesChange(row.original.id, roles)
              : undefined
          }
          disabled={!onRolesChange || isReadOnly}
        />
      );
    },
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
  getEditUserHref?: (user: UserType) => string;
  onDeleteUser?: (user: UserType) => void;
};

export const UsersTable = ({ users, isLoading, pagination, sorting, onRolesChange, getEditUserHref, onDeleteUser }: Props) => {
  const columns = createColumns({ onRolesChange });

  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      showColumnFilters={false}
      getEditRowHref={getEditUserHref}
      onDeleteRow={onDeleteUser}
      // Users firebase = read-only côté backoffice (Firebase Auth = source
      // de vérité, leur édition/suppression doit passer par l'app mobile).
      isRowReadOnly={user => Boolean(user.firebaseUid)}
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
