import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { ClassementsTable, ExportMenu } from '@/components/classements';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // Scroll indicators pour les onglets
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Vérifier la position de scroll des onglets
  const checkScrollPosition = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition, races]);

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

  // Compter les classés par course
  const rankedCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const race of races) {
      counts[race] = countRanked(engagements, race);
    }
    return counts;
  }, [engagements, races]);

  // Total général
  const totalRanked = useMemo(
    () => engagements.filter((e) => e.rankingScratch != null || e.comment != null).length,
    [engagements]
  );
  const totalEngagements = engagements.length;

  const toolbarLeft = competition ? (
    <div className="flex items-center gap-2">
      <h1 className="text-lg font-semibold">{competition.name}</h1>
      <Badge variant="outline">
        {totalRanked}/{totalEngagements} classé{totalRanked > 1 ? 's' : ''}
      </Badge>
    </div>
  ) : null;

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-2">
      {competition && currentRaceCode && (
        <ExportMenu
          engagements={engagements}
          currentRaceCode={currentRaceCode}
          races={races}
          competitionName={competition.name}
          avecChrono={competition.avecChrono ?? false}
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
      <Button variant="outline" onClick={() => navigate('/competitions')}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>
    </div>
  );

  const isLoading = isLoadingCompetition || isLoadingEngagements;

  if (isLoading && !competition) {
    return (
      <Layout title="Classements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  if (!competition) {
    return (
      <Layout title="Classements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8 text-destructive">
          Compétition non trouvée
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Classements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="space-y-2">
        {/* Onglets des courses */}
        {races.length > 0 && (
          <Tabs value={currentRaceCode} onValueChange={handleRaceChange} className="w-full">
            <div className="relative flex items-center gap-1">
              {/* Indicateur scroll gauche */}
              <div
                className={`shrink-0 transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsList
                ref={tabsRef}
                className="mb-0 flex w-full justify-start gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-x-auto scrollbar-none border-0"
              >
                {races.map((race) => (
                  <TabsTrigger
                    key={race}
                    value={race}
                    className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                  >
                    <span className="text-base font-bold">{race}</span>
                    <Badge variant="secondary" className="text-xs">
                      {rankedCount[race] || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Indicateur scroll droite */}
              <div
                className={`shrink-0 transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Tabs>
        )}

        {/* Tableau des classements - aligné avec les onglets (compense les chevrons) */}
        {currentRaceCode && (
          <div className="flex items-start gap-1">
            <div className="shrink-0 w-4" /> {/* Spacer gauche */}
            <div className="flex-1 min-w-0">
              <ClassementsTable
                engagements={engagements}
                currentRaceCode={currentRaceCode}
                competitionId={competition.id}
                avecChrono={competition.avecChrono ?? false}
                isLoading={isLoadingEngagements}
              />
            </div>
            <div className="shrink-0 w-4" /> {/* Spacer droite */}
          </div>
        )}
      </div>
    </Layout>
  );
}
