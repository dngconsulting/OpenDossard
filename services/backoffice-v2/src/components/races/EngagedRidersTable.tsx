import { DataTable } from '@/components/ui/data-table';
import type { EngagedRider } from '@/types/races';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<EngagedRider>[] = [
  {
    accessorKey: 'bibNumber',
    header: 'Dossard',
  },
  {
    accessorKey: 'name',
    header: 'Nom',
  },
  {
    accessorKey: 'club',
    header: 'Club',
  },
  {
    accessorKey: 'gender',
    header: 'Sexe',
  },
  {
    accessorKey: 'dept',
    header: 'Dept',
  },
  {
    accessorKey: 'category',
    header: 'Catégorie',
  },
];

type Props = {
  engagedRiders: EngagedRider[];
  onDeleteRider: (rider: EngagedRider) => void;
  isLoading?: boolean;
};

export const EngagedRidersTable = ({ engagedRiders, onDeleteRider, isLoading }: Props) => {
  return (
    <DataTable
      columns={columns}
      data={engagedRiders}
      onDeleteRow={onDeleteRider}
      isLoading={isLoading}
    />
  );
};
