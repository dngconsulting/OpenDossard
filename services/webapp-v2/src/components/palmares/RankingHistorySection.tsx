import { ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryChange } from '@/types/palmares';

type Props = {
  history: CategoryChange[];
};

export function RankingHistorySection({ history }: Props) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution de catégorie</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas d'évolution de catégorie enregistrée</p>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map((change, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span className="font-medium min-w-[60px]">{change.season}</span>
                <span className="text-muted-foreground">{change.fromCategory || 'Nouveau'}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{change.toCategory}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
