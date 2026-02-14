import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PalmaresRaceResult } from '@/types/palmares';

import type { ColumnDef } from '@tanstack/react-table';

type Props = {
  results: PalmaresRaceResult[];
};

const DNF_CODES = ['ABD', 'DSQ', 'NC', 'NP', 'CHT', 'HD', 'DNV'];

const PODIUM_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-700',
};

function RankingCell({ row }: { row: PalmaresRaceResult }) {
  if (row.comment && DNF_CODES.includes(row.comment.toUpperCase())) {
    return (
      <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300">
        {row.comment.toUpperCase()}
      </Badge>
    );
  }
  if (row.rankingScratch != null && row.rankingInCategory != null) {
    const podiumColor = PODIUM_COLORS[row.rankingInCategory];
    return (
      <span className="inline-flex items-center gap-1.5 text-base">
        {podiumColor && <Trophy className={`h-4 w-4 ${podiumColor}`} />}
        <span className="font-semibold">{row.rankingScratch}</span>
        <span className="text-muted-foreground text-sm">({row.rankingInCategory}/{row.totalInCategory})</span>
      </span>
    );
  }
  return <span className="text-muted-foreground">&mdash;</span>;
}

const columns: ColumnDef<PalmaresRaceResult>[] = [
  {
    id: 'ranking',
    header: 'Classement',
    size: 110,
    cell: ({ row }) => <RankingCell row={row.original} />,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    size: 100,
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <span className="tabular-nums">{date.toLocaleDateString('fr-FR')}</span>;
    },
  },
  {
    accessorKey: 'competitionName',
    header: 'Compétition',
    cell: ({ row }) => (
      <Link
        to={`/competition/${row.original.competitionId}/classements#cate_course`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.getValue('competitionName')}
      </Link>
    ),
  },
  {
    accessorKey: 'club',
    header: 'Club',
    size: 140,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate">{row.getValue('club') || '\u2014'}</span>
    ),
  },
  {
    accessorKey: 'raceCode',
    header: 'Course',
    size: 100,
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono text-xs">
        {row.getValue('raceCode')}
      </Badge>
    ),
  },
  {
    accessorKey: 'catev',
    header: 'Cat.',
    size: 60,
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-xs">
        {row.getValue('catev')}
      </Badge>
    ),
  },
  {
    accessorKey: 'catea',
    header: "Cat. d'âge",
    size: 90,
    cell: ({ row }) => {
      const catea = row.getValue('catea') as string | null;
      return catea ? (
        <Badge variant="outline" className="font-mono text-xs">
          {catea}
        </Badge>
      ) : (
        <span className="text-muted-foreground">&mdash;</span>
      );
    },
  },
];

type SortConfig = {
  column: string;
  direction: 'ASC' | 'DESC';
};

function sortResults(results: PalmaresRaceResult[], sort: SortConfig | null): PalmaresRaceResult[] {
  if (!sort) return results;

  return [...results].sort((a, b) => {
    const dir = sort.direction === 'ASC' ? 1 : -1;

    switch (sort.column) {
      case 'ranking': {
        const aRank = a.rankingScratch ?? Infinity;
        const bRank = b.rankingScratch ?? Infinity;
        return (aRank - bRank) * dir;
      }
      case 'date':
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      case 'competitionName':
        return a.competitionName.localeCompare(b.competitionName, 'fr') * dir;
      case 'club':
        return (a.club ?? '').localeCompare(b.club ?? '', 'fr') * dir;
      case 'raceCode':
        return a.raceCode.localeCompare(b.raceCode, 'fr') * dir;
      case 'catev':
        return a.catev.localeCompare(b.catev, 'fr') * dir;
      case 'catea':
        return (a.catea ?? '').localeCompare(b.catea ?? '', 'fr') * dir;
      default:
        return 0;
    }
  });
}

export function PalmaresResultsTable({ results }: Props) {
  const routeResults = results.filter(r => r.competitionType === 'ROUTE');
  const cxResults = results.filter(r => r.competitionType === 'CX');

  const [routeSort, setRouteSort] = useState<SortConfig | null>(null);
  const [cxSort, setCxSort] = useState<SortConfig | null>(null);

  const sortedRoute = useMemo(() => sortResults(routeResults, routeSort), [routeResults, routeSort]);
  const sortedCx = useMemo(() => sortResults(cxResults, cxSort), [cxResults, cxSort]);

  const handleRouteSortChange = (column: string, direction: 'ASC' | 'DESC') => {
    setRouteSort({ column, direction });
  };

  const handleCxSortChange = (column: string, direction: 'ASC' | 'DESC') => {
    setCxSort({ column, direction });
  };

  return (
    <div className="rounded-xl border bg-card">
      <Tabs defaultValue="route">
        <div className="px-5 pt-5 pb-0 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Résultats</h3>
          <TabsList>
            <TabsTrigger value="route">Route ({routeResults.length})</TabsTrigger>
            <TabsTrigger value="cx">Cyclo-cross ({cxResults.length})</TabsTrigger>
          </TabsList>
        </div>
        <div className="p-5 pt-3">
          <TabsContent value="route" className="mt-0">
            {routeResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucun résultat en Route</p>
            ) : (
              <DataTable
                columns={columns}
                data={sortedRoute}
                showColumnFilters={false}
                sorting={{
                  sortColumn: routeSort?.column,
                  sortDirection: routeSort?.direction,
                  onSortChange: handleRouteSortChange,
                }}
              />
            )}
          </TabsContent>
          <TabsContent value="cx" className="mt-0">
            {cxResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucun résultat en Cyclo-cross</p>
            ) : (
              <DataTable
                columns={columns}
                data={sortedCx}
                showColumnFilters={false}
                sorting={{
                  sortColumn: cxSort?.column,
                  sortDirection: cxSort?.direction,
                  onSortChange: handleCxSortChange,
                }}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
