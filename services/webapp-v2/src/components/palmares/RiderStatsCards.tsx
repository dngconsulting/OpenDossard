import { Trophy, Medal, Target, TrendingUp, Award, Hash } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { RiderStats } from '@/types/palmares';

type Props = {
  stats: RiderStats;
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiderStatsCards({ stats }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <StatCard icon={<Target className="h-5 w-5" />} label="Total courses" value={stats.totalRaces} />
      <StatCard icon={<Trophy className="h-5 w-5" />} label="Victoires" value={stats.wins} />
      <StatCard icon={<Medal className="h-5 w-5" />} label="Podiums" value={stats.podiums} />
      <StatCard icon={<Hash className="h-5 w-5" />} label="Top 10" value={stats.topTen} />
      <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Classement moyen" value={stats.avgRanking} />
      <StatCard icon={<Award className="h-5 w-5" />} label="Meilleur classement" value={stats.bestRanking} />
    </div>
  );
}
