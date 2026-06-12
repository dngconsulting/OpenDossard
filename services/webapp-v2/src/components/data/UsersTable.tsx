
import { DataTable } from '@/components/ui/data-table';
import { RolesMultiSelect } from '@/components/ui/roles-multi-select';
import type { UserType, UserSource, PaginationMeta } from '@/types/users';

import type { ColumnDef } from '@tanstack/react-table';

type ColumnsProps = {
  variant: UserSource;
  onRolesChange?: (userId: number, roles: string) => void;
};

// Colonnes par population. Onglet Dossardeur : l'email n'est pas persisté
// côté backend (source de vérité = Firebase Auth), l'identifiant affiché —
// et triable — est le firebase_uid ; pas de téléphone. Onglet Open Dossard :
// identifié par l'email, colonnes téléphone et rôles éditables.
const createColumns = ({ variant, onRolesChange }: ColumnsProps): ColumnDef<UserType>[] => {
  const identifierColumn: ColumnDef<UserType> =
    variant === 'dossardeur'
      ? {
          accessorKey: 'firebaseUid',
          header: 'Identifiant',
          cell: ({ row }) => (
            <span
              className="font-mono text-xs text-muted-foreground"
              title="Identifiant Firebase Auth (utilisateur mobile)"
            >
              {row.original.firebaseUid}
            </span>
          ),
        }
      : {
          accessorKey: 'email',
          header: 'Email',
          cell: ({ row }) => row.original.email ?? '—',
        };

  return [
    identifierColumn,
    {
      accessorKey: 'firstName',
      header: 'Prénom',
    },
    {
      accessorKey: 'lastName',
      header: 'Nom',
    },
    ...(variant === 'dossardeur'
      ? []
      : [
          {
            accessorKey: 'phone',
            header: 'Téléphone/Club',
            size: 140,
          } satisfies ColumnDef<UserType>,
        ]),
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
};

type Props = {
  users: UserType[];
  isLoading: boolean;
  /** Population affichée : pilote les colonnes, leurs libellés et le caractère readonly */
  variant: UserSource;
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

export const UsersTable = ({ users, isLoading, variant, pagination, sorting, onRolesChange, getEditUserHref, onDeleteUser }: Props) => {
  // Users Dossardeur = read-only côté backoffice (Firebase Auth = source de
  // vérité, leur édition/suppression doit passer par l'app mobile)
  const isReadOnly = variant === 'dossardeur';
  const columns = createColumns({ variant, onRolesChange: isReadOnly ? undefined : onRolesChange });

  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      showColumnFilters={false}
      getEditRowHref={isReadOnly ? undefined : getEditUserHref}
      onDeleteRow={isReadOnly ? undefined : onDeleteUser}
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
