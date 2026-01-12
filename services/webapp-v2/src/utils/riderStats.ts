import type { RaceResultType } from '@/components/data/ChallengeTable';

export interface RiderStats {
  totalRaces: number;
  totalPoints: number;
  bestPosition: number;
  avgPosition: string;
}

export function calculateRiderStats(results: RaceResultType[]): RiderStats {
  const totalRaces = results.length;
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const bestPosition = results.reduce(
    (best, r) => (r.position < best ? r.position : best),
    Infinity
  );
  const avgPosition =
    totalRaces > 0
      ? (results.reduce((sum, r) => sum + r.position, 0) / totalRaces).toFixed(1)
      : '0';

  return { totalRaces, totalPoints, bestPosition, avgPosition };
}
