import { ArrowLeft, Monitor, Plus, Smartphone, type LucideIcon } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RaceTabsList, RaceTabsTrigger } from '@/components/ui/race-tabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import type { UserSource } from '@/types/users';

import { UsersTabPanel } from './UsersTabPanel';

const TABS: { value: UserSource; label: string; icon: LucideIcon }[] = [
  { value: 'opendossard', label: 'Utilisateurs Open Dossard', icon: Monitor },
  { value: 'dossardeur', label: 'Utilisateurs Dossardeur', icon: Smartphone },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Défaut = Open Dossard : c'est la population administrable (ajout/édition),
  // et les anciens liens/bookmarks vers /users (avant les onglets) visaient
  // cette liste-là
  const activeTab: UserSource =
    searchParams.get('tab') === 'dossardeur' ? 'dossardeur' : 'opendossard';

  // Changer d'onglet repart d'un état vierge (recherche, tri, pagination) :
  // chaque onglet interroge une population différente, conserver l'offset ou
  // le terme de recherche de l'autre onglet n'aurait pas de sens
  const handleTabChange = useCallback(
    (tab: string) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );

  const toolbarLeft = (
    <Button variant="outline" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-4 w-4" /> Retour
    </Button>
  );

  // L'ajout d'utilisateur n'existe que côté Open Dossard : les comptes
  // Dossardeur sont créés par l'app mobile (Firebase Auth)
  const toolbar =
    activeTab === 'opendossard' ? (
      <Button onClick={() => navigate('/user/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un utilisateur
      </Button>
    ) : undefined;

  return (
    <Layout title="Utilisateurs" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-0">
        <RaceTabsList>
          {TABS.map(tab => (
            <RaceTabsTrigger key={tab.value} value={tab.value}>
              <tab.icon className="h-6 w-6" strokeWidth={2.5} />
              <span className="text-base font-bold">{tab.label}</span>
            </RaceTabsTrigger>
          ))}
        </RaceTabsList>
        {TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <Card className="rounded-t-none border-t-0">
              <CardContent className="pt-6">
                <UsersTabPanel source={tab.value} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </Layout>
  );
}
