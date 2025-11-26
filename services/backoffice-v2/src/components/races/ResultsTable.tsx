import { DataTable } from '@/components/ui/data-table';
import type { RaceResult } from '@/types/races';

import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<RaceResult>[] = [
  {
    accessorKey: 'bibNumber',
    header: 'Dossard',
  },
  {
    accessorKey: 'rank',
    header: 'Rang',
  },
  {
    accessorKey: 'chrono',
    header: 'Chrono',
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
  results: RaceResult[];
  isLoading?: boolean;
};

export const ResultsTable = ({ results, isLoading }: Props) => {
  return (
    <DataTable
      columns={columns}
      data={results}
      isLoading={isLoading}
    />
  );
};
