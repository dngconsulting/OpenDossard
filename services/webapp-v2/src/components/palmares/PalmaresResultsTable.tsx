import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PalmaresRaceResult } from '@/types/palmares';

import type { ColumnDef } from '@tanstack/react-table';

type Props = {
  results: PalmaresRaceResult[];
};

const columns: ColumnDef<PalmaresRaceResult>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return date.toLocaleDateString('fr-FR');
    },
  },
  {
    accessorKey: 'competitionName',
    header: 'Compétition',
  },
  {
    accessorKey: 'category',
    header: 'Catégorie',
  },
  {
    accessorKey: 'ranking',
    header: 'Classement',
    cell: ({ row }) => {
      const ranking = row.getValue('ranking') as number;
      const total = row.original.totalParticipants;
      return total ? `${ranking}/${total}` : ranking;
    },
  },
];

export function PalmaresResultsTable({ results }: Props) {
  const navigate = useNavigate();

  const routeResults = results
    .filter(r => r.competitionType === 'ROUTE')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const cxResults = results
    .filter(r => r.competitionType === 'CX')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRowClick = (result: PalmaresRaceResult) => {
    navigate(`/races?competitionId=${result.competitionId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="route">
          <TabsList>
            <TabsTrigger value="route">Route ({routeResults.length})</TabsTrigger>
            <TabsTrigger value="cx">Cyclo-cross ({cxResults.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="route" className="mt-4">
            {routeResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucun résultat en Route</p>
            ) : (
              <DataTable columns={columns} data={routeResults} onOpenRow={handleRowClick} />
            )}
          </TabsContent>
          <TabsContent value="cx" className="mt-4">
            {cxResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucun résultat en Cyclo-cross</p>
            ) : (
              <DataTable columns={columns} data={cxResults} onOpenRow={handleRowClick} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
