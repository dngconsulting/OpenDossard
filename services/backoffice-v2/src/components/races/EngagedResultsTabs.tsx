import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddEngagedRider, useRemoveEngagedRider, useUpdateResultsRankings } from '@/hooks/useRaces';
import type { EngagedRider, RaceCategory, RaceResult } from '@/types/races';

import { AddEngagedRiderDialog } from './AddEngagedRiderDialog';
import { EngagedRidersTable } from './EngagedRidersTable';
import { ResultsTable } from './ResultsTable';

type Props = {
  raceId: string;
  category: RaceCategory;
};

export const EngagedResultsTabs = ({ raceId, category }: Props) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const addEngagedRider = useAddEngagedRider();
  const removeEngagedRider = useRemoveEngagedRider();
  const updateResultsRankings = useUpdateResultsRankings();

  const handleAddRider = (rider: Omit<EngagedRider, 'id'>) => {
    addEngagedRider.mutate({
      raceId,
      categoryId: category.id,
      rider,
    });
  };

  const handleDeleteRider = (rider: EngagedRider) => {
    removeEngagedRider.mutate({
      raceId,
      categoryId: category.id,
      riderId: rider.id,
    });
  };

  const handleResultsReorder = (reorderedResults: RaceResult[]) => {
    updateResultsRankings.mutate({
      raceId,
      categoryId: category.id,
      resultIds: reorderedResults.map(r => r.id),
    });
  };

  return (
    <>
      <AddEngagedRiderDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddRider}
      />

      <Tabs defaultValue="engaged" className="w-full">
        <TabsList>
          <TabsTrigger value="engaged">
            Engagés ({category.engagedRiders.length})
          </TabsTrigger>
          <TabsTrigger value="results">
            Classement ({category.results.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="engaged">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des engagés</CardTitle>
                  <CardDescription>
                    {category.engagedRiders.length} coureur(s) inscrit(s)
                  </CardDescription>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un engagé
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EngagedRidersTable
                engagedRiders={category.engagedRiders}
                onDeleteRider={handleDeleteRider}
                isLoading={addEngagedRider.isPending || removeEngagedRider.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Classement</CardTitle>
                  <CardDescription>
                    {category.results.length} résultat(s)
                  </CardDescription>
                </div>
                <Button disabled variant="outline">
                  Importer CSV (prochainement)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResultsTable
                results={category.results}
                onResultsReorder={handleResultsReorder}
                isLoading={updateResultsRankings.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};
