import { useState } from 'react';

import { ChallengeCategoryTabs } from '@/components/challenges/ChallengeCategoryTabs';
import { RiderDetailsDialog } from '@/components/challenges/RiderDetailsDialog';
import type { ChallengeTableType } from '@/components/data/ChallengeTable';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldSeparator } from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ChallengesPage() {
  const [openedRider, setOpenedRider] = useState<ChallengeTableType>();

  return (
    <Layout title="Challenges">
      <RiderDetailsDialog rider={openedRider} onClose={() => setOpenedRider(undefined)} />
      <Tabs defaultValue="printemps" className="w-full gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Challenges 2025</CardTitle>
            <CardDescription>Sélectionnez le challenge ci dessous</CardDescription>
          </CardHeader>
          <CardContent>
            <TabsList>
              <TabsTrigger value="printemps">Printemps</TabsTrigger>
              <TabsTrigger value="automne">Automne</TabsTrigger>
              <TabsTrigger value="assiduite">Assiduité</TabsTrigger>
              <TabsTrigger value="radar">Radar</TabsTrigger>
              <TabsTrigger value="cx">Cx</TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>
        <FieldSeparator />
        <TabsContent value="printemps">
          <ChallengeCategoryTabs onRiderSelect={setOpenedRider} />
        </TabsContent>
        <TabsContent value="automne">Automne</TabsContent>
        <TabsContent value="assiduite">Assiduité</TabsContent>
        <TabsContent value="radar">Radar</TabsContent>
        <TabsContent value="cx">Cyclo cross</TabsContent>
      </Tabs>
    </Layout>
  );
}
