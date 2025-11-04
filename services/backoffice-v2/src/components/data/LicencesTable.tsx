import { DataTable } from '@/components/ui/data-table.tsx';
import { useLicences } from '@/hooks/useLicences';
import type { LicenceType } from '@/types/licences.ts';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<LicenceType>[] = [
  {
    accessorKey: 'licenceNumber',
    header: 'N Licence',
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
    accessorKey: 'federation',
    header: 'Fédération',
  },
  {
    accessorKey: 'club',
    header: 'Club',
  },
  {
    accessorKey: 'category',
    header: 'Catégorie',
  },
  {
    accessorKey: 'state',
    header: 'Département',
  },
  {
    accessorKey: 'birthYear',
    header: 'Année de naissance',
  },
  {
    accessorKey: 'ageCategory',
    header: "Catégorie d'âge",
  },
  {
    accessorKey: 'season',
    header: 'Saison',
  },
];

type LicenceTableProps = {
  onEdit?: (row: LicenceType) => void;
  onDelete?: (row: LicenceType) => void;
};

export const LicencesDataTable = ({ onEdit, onDelete }: LicenceTableProps) => {
  const { data: licences, isLoading, error } = useLicences();

  if (error) {
    return <div>Error loading licences</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={licences || []}
      onEditRow={onEdit}
      onDeleteRow={onDelete}
      isLoading={isLoading}
    />
  );
};
