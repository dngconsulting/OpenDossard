import { DataTable } from '@/components/ui/data-table.tsx';
import { useUsers } from '@/hooks/useUsers';

import type { ColumnDef } from '@tanstack/react-table';

export type UserTableType = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

const columns: ColumnDef<UserTableType>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'lastName',
    header: 'Nom',
  },
  {
    accessorKey: 'firstName',
    header: 'Prénom',
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Téléphone',
  },
];

type Props = {
  onDeleteRow: (row: UserTableType) => void;
  onEditRow: (row: UserTableType) => void;
};

export const UsersTable = ({ onDeleteRow, onEditRow }: Props) => {
  const { data: users, isLoading, error } = useUsers();

  if (error) {
    return <div>Error loading users</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={users || []}
      onDeleteRow={onDeleteRow}
      onEditRow={onEditRow}
      isLoading={isLoading}
    />
  );
};
