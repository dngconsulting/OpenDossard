import { ArrowUp, ArrowDown, Circle } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CategoryChange } from '@/types/palmares';

type Props = {
  historyRoute: CategoryChange[];
  historyCX: CategoryChange[];
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

export function RankingHistorySection({ historyRoute, historyCX }: Props) {
  if (historyRoute.length === 0 && historyCX.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <Tabs defaultValue="route">
        <div className="px-5 pt-5 pb-0 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Évolution de catégorie
          </h3>
          <TabsList>
            <TabsTrigger value="route">Route</TabsTrigger>
            <TabsTrigger value="cx">Cyclo-cross</TabsTrigger>
          </TabsList>
        </div>
        <div className="p-5 pt-3">
          <TabsContent value="route" className="mt-0">
            <CategoryTimeline history={historyRoute} />
          </TabsContent>
          <TabsContent value="cx" className="mt-0">
            <CategoryTimeline history={historyCX} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
