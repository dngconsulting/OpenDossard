import { DataTable } from '@/components/ui/data-table.tsx';
import { useRaces } from '@/hooks/useRaces';
import type { RaceType } from '@/types/races.ts';

import type { CellContext, ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<RaceType>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'name',
    header: "Nom de l'épreuve",
  },
  {
    accessorKey: 'zip',
    header: 'Code postal',
  },
  {
    accessorKey: 'club',
    header: 'Club organisateur',
  },
  {
    accessorKey: 'categories',
    header: 'Catégories',
    cell: (info: CellContext<RaceType, unknown>) => {
      const categories = info.getValue() as RaceType['categories'];
      return categories.map(cat => cat.name).join(', ');
    },
  },
  {
    accessorKey: 'federation',
    header: 'Fédération',
  },
  {
    accessorKey: 'engagedCount',
    header: "Nombre d'engagés",
  },
];

type Props = {
  onDeleteRow: (row: RaceType) => void;
  onEditRow: (row: RaceType) => void;
};

export const RacesTable = ({ onDeleteRow, onEditRow }: Props) => {
  const { data: races, isLoading, error } = useRaces();

  if (error) {
    return <div>Error loading races</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={races || []}
      onDeleteRow={onDeleteRow}
      onEditRow={onEditRow}
      isLoading={isLoading}
    />
  );
};
