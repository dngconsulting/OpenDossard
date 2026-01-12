import type { ChallengeTableType } from '@/components/data/ChallengeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { calculateRiderStats } from '@/utils/riderStats';

import { RiderResultsTable } from './RiderResultsTable';

interface RiderDetailsDialogProps {
  rider: ChallengeTableType | undefined;
  onClose: () => void;
}

export function RiderDetailsDialog({ rider, onClose }: RiderDetailsDialogProps) {
  if (!rider) {
    return null;
  }

  const { totalRaces, totalPoints, bestPosition, avgPosition } = calculateRiderStats(rider.results);

  return (
    <Dialog open={!!rider} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-[90%] sm:max-w-[calc(100%-2rem)] lg:max-w-[900px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            Palmarès de {rider.firstName} {rider.lastName}
          </DialogTitle>
          <DialogDescription>
            {rider.club} - Catégorie {rider.category} ({rider.ageCategory})
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRaces}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Points totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPoints}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Meilleure place</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bestPosition}e</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Place moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgPosition}e</div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <RiderResultsTable results={rider.results} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
