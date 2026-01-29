import { ArrowUp, ArrowDown, Circle } from 'lucide-react';

import type { CategoryChange } from '@/types/palmares';

type Props = {
  history: CategoryChange[];
};

const directionConfig = {
  up: { icon: ArrowUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30' },
  down: { icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/30' },
  initial: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-500/10', ring: 'ring-slate-500/30' },
};

export function RankingHistorySection({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Évolution de catégorie
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {history.map((change, index) => {
          const config = directionConfig[change.direction];
          const Icon = config.icon;
          return (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <div className="h-px w-4 bg-border" />
              )}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ring-1 ${config.bg} ${config.ring}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                <span className="font-semibold">{change.toCategory}</span>
                <span className="text-muted-foreground text-xs">{change.season}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
