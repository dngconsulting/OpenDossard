import { Trophy, Medal, Target, Award, Hash } from 'lucide-react';

import type { RiderStats } from '@/types/palmares';

type Props = {
  stats: RiderStats;
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
};

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className={`flex-1 min-w-[130px] rounded-xl border bg-card p-4 relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function RiderStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard icon={<Target className="h-4 w-4" />} label="Courses" value={stats.totalRaces} accent="bg-blue-500" />
      <StatCard icon={<Trophy className="h-4 w-4" />} label="Victoires" value={stats.wins} accent="bg-yellow-500" />
      <StatCard icon={<Medal className="h-4 w-4" />} label="Podiums" value={stats.podiums} accent="bg-orange-500" />
      <StatCard icon={<Hash className="h-4 w-4" />} label="Top 10" value={stats.topTen} accent="bg-emerald-500" />
      <StatCard icon={<Award className="h-4 w-4" />} label="Meilleur" value={stats.bestRanking} accent="bg-purple-500" />
    </div>
  );
}
