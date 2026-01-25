import { DataTable } from '@/components/ui/data-table.tsx';

import type { ColumnDef } from '@tanstack/react-table';

export type RaceResultType = {
  id: string;
  raceName: string;
  raceDate: string;
  position: number;
  points: number;
  participants: number;
  raceType: string;
};

export type ChallengeTableType = {
  id: string;
  firstName: string;
  lastName: string;
  club: string;
  category: string;
  ageCategory: string;
  points: string;
  results: RaceResultType[];
};

const columns: ColumnDef<ChallengeTableType>[] = [
  {
    accessorKey: 'firstName',
    header: 'Prénom',
  },
  {
    accessorKey: 'lastName',
    header: 'Nom',
  },
  {
    accessorKey: 'club',
    header: 'Club',
  },
  {
    accessorKey: 'category',
    header: 'Caté',
  },
  {
    accessorKey: 'ageCategory',
    header: 'Caté âge',
  },
  {
    accessorKey: 'points',
    header: 'Points',
  },
];

type Props = {
  data?: ChallengeTableType[];
  isLoading?: boolean;
  onOpenRow?: (row: ChallengeTableType) => void;
};

export const ChallengeTable = ({ data, isLoading, onOpenRow }: Props) => {
  return (
    <DataTable
      columns={columns}
      data={data || []}
      onOpenRow={onOpenRow}
      isLoading={isLoading}
    />
  );
};
