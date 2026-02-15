import { ArrowUp, ArrowDown, Circle } from 'lucide-react';
import { useMemo } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COMPETITION_TYPES, COMPETITION_TYPE_LABELS, type CompetitionType } from '@/types/api';
import type { CategoryChange } from '@/types/palmares';

type Props = {
  categoryHistory: Record<string, CategoryChange[]>;
  typeOrder?: string[];
};

const directionConfig = {
  up: { icon: ArrowUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30' },
  down: { icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/30' },
  initial: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-500/10', ring: 'ring-slate-500/30' },
};

function CategoryTimeline({ history }: { history: CategoryChange[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Aucune évolution de catégorie</p>
    );
  }

  return (
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
  );
}

export function RankingHistorySection({ categoryHistory, typeOrder }: Props) {
  const types = useMemo(() => {
    const present = new Set(Object.keys(categoryHistory));
    if (typeOrder) {
      return typeOrder.filter(t => present.has(t));
    }
    return (COMPETITION_TYPES as readonly string[]).filter(t => present.has(t));
  }, [categoryHistory, typeOrder]);

  const hasAnyHistory = types.some(t => (categoryHistory[t]?.length ?? 0) > 0);
  if (!hasAnyHistory) return null;

  const defaultTab = types[0] ?? '';

  return (
    <div className="rounded-xl border bg-card">
      <Tabs defaultValue={defaultTab}>
        <div className="px-5 pt-5 pb-0 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Évolution de catégorie
          </h3>
          <TabsList>
            {types.map(t => (
              <TabsTrigger key={t} value={t}>
                {COMPETITION_TYPE_LABELS[t as CompetitionType] ?? t}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="p-5 pt-3">
          {types.map(t => (
            <TabsContent key={t} value={t} className="mt-0">
              <CategoryTimeline history={categoryHistory[t] ?? []} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
