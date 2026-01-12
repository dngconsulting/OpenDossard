import { DataTable } from '@/components/ui/data-table.tsx';
import { useChallenges } from '@/hooks/useChallenges';

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
  onOpenRow?: (row: ChallengeTableType) => void;
};

export const ChallengeTable = ({ onOpenRow }: Props) => {
  const { data: challenge, isLoading, error } = useChallenges();

  if (error) {
    return <div>Error loading challenges</div>;
  }

  return (
    <DataTable
      columns={columns}
      data={challenge || []}
      onOpenRow={onOpenRow}
      isLoading={isLoading}
    />
  );
};
