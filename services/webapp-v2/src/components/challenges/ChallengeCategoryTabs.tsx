import { ChallengeTable, type ChallengeTableType } from '@/components/data/ChallengeTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { RaceEventsPopover } from './RaceEventsPopover';

interface ChallengeCategoryTabsProps {
  onRiderSelect: (rider: ChallengeTableType) => void;
}

export function ChallengeCategoryTabs({ onRiderSelect }: ChallengeCategoryTabsProps) {
  return (
    <Tabs defaultValue="1" className="w-full">
      <div className="w-full flex justify-between items-center gap-8">
        <TabsList>
          <TabsTrigger value="1">Caté 1</TabsTrigger>
          <TabsTrigger value="2">Caté 2</TabsTrigger>
          <TabsTrigger value="3">Caté 3</TabsTrigger>
          <TabsTrigger value="4">Caté 4</TabsTrigger>
          <TabsTrigger value="5">Caté 5</TabsTrigger>
        </TabsList>
        <RaceEventsPopover />
      </div>
      <TabsContent value="1">
        <ChallengeTable onOpenRow={onRiderSelect} />
      </TabsContent>
      <TabsContent value="2">
        <ChallengeTable />
      </TabsContent>
      <TabsContent value="3">
        <ChallengeTable />
      </TabsContent>
      <TabsContent value="4">
        <ChallengeTable />
      </TabsContent>
      <TabsContent value="5">
        <ChallengeTable />
      </TabsContent>
    </Tabs>
  );
}
