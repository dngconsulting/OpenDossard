import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PalmaresRaceResult } from '@/types/palmares';

import type { ColumnDef } from '@tanstack/react-table';

type Props = {
  results: PalmaresRaceResult[];
};

const DNF_CODES = ['ABD', 'DSQ', 'NC', 'NP', 'CHT', 'HD', 'DNV'];

function RankingCell({ row }: { row: PalmaresRaceResult }) {
  if (row.comment && DNF_CODES.includes(row.comment.toUpperCase())) {
    return (
      <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300">
        {row.comment.toUpperCase()}
      </Badge>
    );
  }
  if (row.rankingScratch != null && row.rankingInCategory != null) {
    return (
      <span>
        <span className="font-semibold">{row.rankingScratch}</span>
        <span className="text-muted-foreground"> ({row.rankingInCategory}/{row.totalInCategory})</span>
      </span>
    );
  }
  return <span className="text-muted-foreground">&mdash;</span>;
}

const columns: ColumnDef<PalmaresRaceResult>[] = [
  {
    id: 'ranking',
    header: 'Classement',
    size: 140,
    cell: ({ row }) => <RankingCell row={row.original} />,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    size: 100,
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
    accessorKey: 'raceCode',
    header: 'Catégorie',
    size: 100,
  },
];

export function PalmaresResultsTable({ results }: Props) {
  const routeResults = results.filter(r => r.competitionType === 'ROUTE');
  const cxResults = results.filter(r => r.competitionType === 'CX');

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
              <DataTable columns={columns} data={routeResults} />
            )}
          </TabsContent>
          <TabsContent value="cx" className="mt-4">
            {cxResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucun résultat en Cyclo-cross</p>
            ) : (
              <DataTable columns={columns} data={cxResults} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
