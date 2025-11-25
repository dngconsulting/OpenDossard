import type { RaceResultType } from '@/components/data/ChallengeTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRaceDate } from '@/utils/styleHelpers';

interface RiderResultsTableProps {
  results: RaceResultType[];
}

function getPositionBadgeClass(position: number): string {
  if (position <= 3) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50';
  }
  if (position <= 10) {
    return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50';
  }
  return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50';
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
                    <Badge variant="default">{result.raceType}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={getPositionBadgeClass(result.position)}>
                      {result.position}e
                    </Badge>
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
