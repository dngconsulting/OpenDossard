import { ArrowLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';

import { ClassementsTable, ExportMenu, ImportClassementButton } from '@/components/classements';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RaceTabsList, RaceTabsTrigger } from '@/components/ui/race-tabs';
import { Tabs } from '@/components/ui/tabs';
import { useCompetition } from '@/hooks/useCompetitions';
import { useCompetitionRaces } from '@/hooks/useRaces';
import { countRanked } from '@/utils/classements';

export default function ClassementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const competitionId = id ? parseInt(id, 10) : undefined;

  // Récupérer la course depuis le hash de l'URL
  const [currentRaceCode, setCurrentRaceCode] = useState<string>('');

  // Ref pour les onglets (scroll horizontal)
  const tabsRef = useRef<HTMLDivElement>(null);

  // Charger les données
  const { data: competition, isLoading: isLoadingCompetition } = useCompetition(competitionId);
  const { data: engagements = [], isLoading: isLoadingEngagements } =
    useCompetitionRaces(competitionId);

  // Liste des courses triées pour l'affichage des onglets
  const races = useMemo(() => {
    if (!competition?.races) return [];
    const racesArray =
      typeof competition.races === 'string'
        ? competition.races.split(',').map((r) => r.trim()).filter(Boolean)
        : competition.races;
    return [...racesArray].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  }, [competition?.races]);

  // Synchroniser le hash avec la course courante
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && races.includes(hash)) {
      setCurrentRaceCode(hash);
    } else if (races.length > 0 && !currentRaceCode) {
      setCurrentRaceCode(races[0]);
      navigate(`#${races[0]}`, { replace: true });
    }
  }, [location.hash, races, currentRaceCode, navigate]);

  // Changer de course
  const handleRaceChange = (raceCode: string) => {
    setCurrentRaceCode(raceCode);
    navigate(`#${raceCode}`, { replace: true });
  };

  // Compter les classés et engagés par course
  const raceCounts = useMemo(() => {
    const counts: Record<string, { ranked: number; engaged: number }> = {};
    for (const race of races) {
      const raceEngagements = engagements.filter((e) => e.raceCode === race);
      counts[race] = {
        ranked: countRanked(engagements, race),
        engaged: raceEngagements.length,
      };
    }
    return counts;
  }, [engagements, races]);

  // Total général
  const totalRanked = useMemo(
    () => engagements.filter((e) => e.rankingScratch != null || e.comment != null).length,
    [engagements]
  );
  const totalEngagements = engagements.length;

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/competitions"
        className="text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors"
      >
        Épreuves
      </Link>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium">
        {competition ? `${competition.name} (${new Date(competition.eventDate).toLocaleDateString('fr-FR')})` : <Skeleton className="h-4 w-32 inline-block" />}
      </span>
    </nav>
  );

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
      {competition && (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
          {totalRanked}/{totalEngagements} classé{totalRanked > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-2">
      {competition && (
        <ImportClassementButton competitionId={competition.id} />
      )}
      {competition && currentRaceCode && (
        <ExportMenu
          engagements={engagements}
          currentRaceCode={currentRaceCode}
          races={races}
          competition={competition}
        />
      )}
      {competition && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => navigate(`/competition/${competition.id}/engagements#${currentRaceCode}`)}
        >
          <ClipboardList className="h-4 w-4" />
          Engagés
        </Button>
      )}
    </div>
  );

  const isLoading = isLoadingCompetition || isLoadingEngagements;

  if (isLoading && !competition) {
    return (
      <Layout title={breadcrumb} toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  if (!competition) {
    return (
      <Layout title={breadcrumb} toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8 text-destructive">
          Compétition non trouvée
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={breadcrumb} toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="space-y-2">
        {/* Onglets des courses */}
        {races.length > 0 && (
          <Tabs value={currentRaceCode} onValueChange={handleRaceChange} className="w-full">
            <RaceTabsList ref={tabsRef}>
              {races.map((race) => (
                <RaceTabsTrigger key={race} value={race}>
                  <span className="text-base font-bold">{race}</span>
                  <Badge variant="secondary" className="text-xs">
                    {raceCounts[race]?.ranked || 0}/{raceCounts[race]?.engaged || 0}
                  </Badge>
                </RaceTabsTrigger>
              ))}
            </RaceTabsList>
          </Tabs>
        )}

        {/* Tableau des classements */}
        {currentRaceCode && (
          <ClassementsTable
            engagements={engagements}
            currentRaceCode={currentRaceCode}
            competitionId={competition.id}
            avecChrono={competition.avecChrono ?? false}
            isLoading={isLoadingEngagements}
          />
        )}
      </div>
    </Layout>
  );
}
