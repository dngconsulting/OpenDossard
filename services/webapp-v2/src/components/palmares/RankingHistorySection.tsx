import { ArrowUp, ArrowDown, Circle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryChange } from '@/types/palmares';

type Props = {
  history: CategoryChange[];
};

function DirectionIcon({ direction }: { direction: CategoryChange['direction'] }) {
  switch (direction) {
    case 'up':
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    default:
      return <Circle className="h-3 w-3 text-muted-foreground" />;
  }
}

export function RankingHistorySection({ history }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution de catégorie</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas d'évolution de catégorie enregistrée</p>
        ) : (
          <div className="space-y-3">
            {history.map((change, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span className="font-medium min-w-[60px]">{change.season}</span>
                <DirectionIcon direction={change.direction} />
                {change.fromCategory ? (
                  <>
                    <span className="text-muted-foreground">{change.fromCategory}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="font-medium">{change.toCategory}</span>
                  </>
                ) : (
                  <span className="font-medium">{change.toCategory}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
