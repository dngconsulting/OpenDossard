import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RaceType } from '@/types/races';

import { RaceCategoryTabs } from './RaceCategoryTabs';

type Props = {
  race: RaceType | undefined;
  onClose: () => void;
};

export const RaceDetailsDialog = ({ race, onClose }: Props) => {
  if (!race) {
    return null;
  }

  const totalEngaged = race.categories.reduce((sum, cat) => sum + cat.engagedRiders.length, 0);

  return (
    <Dialog open={!!race} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-[90%] sm:max-w-[calc(100%-2rem)] lg:max-w-[1200px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>{race.name}</DialogTitle>
          <DialogDescription>
            {race.date} - {race.federation} - {race.club}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total engagés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEngaged}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{race.categories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Lieu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{race.zip}</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Tabs */}
          <RaceCategoryTabs race={race} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
