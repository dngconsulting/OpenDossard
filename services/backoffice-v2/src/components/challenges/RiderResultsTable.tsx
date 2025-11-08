import type { RaceResultType } from '@/components/data/ChallengeTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRaceDate, getPositionBadgeStyle } from '@/utils/styleHelpers';

interface RiderResultsTableProps {
  results: RaceResultType[];
}

export function RiderResultsTable({ results }: RiderResultsTableProps) {
  const sortedResults = [...results].sort(
    (a, b) => new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats détaillés</CardTitle>
        <CardDescription>Saison 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Course</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-center p-3 font-medium">Classement</th>
                <th className="text-center p-3 font-medium">Partants</th>
                <th className="text-center p-3 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => (
                <tr key={result.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{formatRaceDate(result.raceDate)}</td>
                  <td className="p-3 font-medium">{result.raceName}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {result.raceType}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getPositionBadgeStyle(result.position)}`}
                    >
                      {result.position}e
                    </span>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">
                    {result.participants}
                  </td>
                  <td className="p-3 text-center font-semibold">{result.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
