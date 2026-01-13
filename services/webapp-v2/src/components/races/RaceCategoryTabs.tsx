import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RaceType } from '@/types/races';

import { EngagedResultsTabs } from './EngagedResultsTabs';

type Props = {
  race: RaceType;
};

export const RaceCategoryTabs = ({ race }: Props) => {
  if (race.categories.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucune catégorie configurée pour cette course
      </div>
    );
  }

  return (
    <Tabs defaultValue={race.categories[0].id} className="w-full">
      <TabsList>
        {race.categories.map(category => (
          <TabsTrigger key={category.id} value={category.id}>
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {race.categories.map(category => (
        <TabsContent key={category.id} value={category.id}>
          <EngagedResultsTabs raceId={race.id} category={category} />
        </TabsContent>
      ))}
    </Tabs>
  );
};
