import { Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COMPETITION_TYPE_LABELS, type CompetitionType } from '@/types/api';
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
  if (!sort) {
    return results;
  }

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
  // Group results by type, then sort types by descending count
  const { types, resultsByType } = useMemo(() => {
    const map: Record<string, PalmaresRaceResult[]> = {};
    for (const r of results) {
      (map[r.competitionType] ??= []).push(r);
    }
    const sorted = Object.keys(map).sort((a, b) => map[b].length - map[a].length);
    return { types: sorted, resultsByType: map };
  }, [results]);

  const [sortByType, setSortByType] = useState<Record<string, SortConfig | null>>({});

  const defaultTab = types[0] ?? '';

  if (types.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <Tabs defaultValue={defaultTab}>
        <div className="px-5 pt-5 pb-0 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Résultats{types.length === 1 && ` · ${COMPETITION_TYPE_LABELS[types[0] as CompetitionType] ?? types[0]}`}
          </h3>
          {types.length > 1 && (
            <TabsList>
              {types.map(t => (
                <TabsTrigger key={t} value={t}>
                  {COMPETITION_TYPE_LABELS[t as CompetitionType] ?? t} ({resultsByType[t]?.length ?? 0})
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </div>
        <div className="p-5 pt-3">
          {types.map(t => {
            const typeResults = resultsByType[t] ?? [];
            const sort = sortByType[t] ?? null;
            const sorted = sortResults(typeResults, sort);
            return (
              <TabsContent key={t} value={t} className="mt-0">
                {typeResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Aucun résultat en {COMPETITION_TYPE_LABELS[t as CompetitionType] ?? t}
                  </p>
                ) : (
                  <DataTable
                    columns={columns}
                    data={sorted}
                    showColumnFilters={false}
                    sorting={{
                      sortColumn: sort?.column,
                      sortDirection: sort?.direction,
                      onSortChange: (column: string, direction: 'ASC' | 'DESC') => {
                        setSortByType(prev => ({ ...prev, [t]: { column, direction } }));
                      },
                    }}
                  />
                )}
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
