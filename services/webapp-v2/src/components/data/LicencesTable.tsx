import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/ui/data-table.tsx';
import { useLicences } from '@/hooks/useLicences';
import type { LicenceType } from '@/types/licences.ts';

import type { ColumnDef } from '@tanstack/react-table';

type LicenceTableProps = {
  onEdit?: (row: LicenceType) => void;
  onDelete?: (row: LicenceType) => void;
};

export const LicencesDataTable = ({ onEdit, onDelete }: LicenceTableProps) => {
  const navigate = useNavigate();
  const { data: licences, isLoading, error } = useLicences();

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

  if (error) {
    return <div>Error loading licences</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={licences || []}
      onEditRow={onEdit}
      onDeleteRow={onDelete}
      onOpenRow={(row) => navigate(`/palmares/${row.id}`)}
      isLoading={isLoading}
    />
  );
};
