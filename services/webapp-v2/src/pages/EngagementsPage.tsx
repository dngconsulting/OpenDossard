import { ArrowLeft, ChevronLeft, ChevronRight, Download, Shuffle } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { EngagementForm, EngagementsTable, ReorganizeRacesDialog } from '@/components/engagements';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type CompetitionType as CompetitionTypeEnum } from '@/config/federations';
import { useCompetition } from '@/hooks/useCompetitions';
import { useCompetitionRaces } from '@/hooks/useRaces';

export default function EngagementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const competitionId = id ? parseInt(id, 10) : undefined;

  // Récupérer la course depuis le hash de l'URL
  const [currentRaceCode, setCurrentRaceCode] = useState<string>('');
  const [isReorganizeOpen, setIsReorganizeOpen] = useState(false);
  const [needsTabReset, setNeedsTabReset] = useState(false);

  // Scroll indicators pour les onglets
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Charger les données
  const { data: competition, isLoading: isLoadingCompetition } = useCompetition(competitionId);
  const { data: engagements = [], isLoading: isLoadingEngagements } =
    useCompetitionRaces(competitionId);

  // Liste des courses dans l'ordre original (pour la réorganisation)
  // races peut être un string (comma-separated) ou déjà un array
  const racesOriginalOrder = useMemo(() => {
    if (!competition?.races) return [];
    const racesArray = typeof competition.races === 'string'
      ? competition.races.split(',').map(r => r.trim()).filter(Boolean)
      : competition.races;
    return racesArray;
  }, [competition?.races]);

  // Liste des courses triées pour l'affichage des onglets
  const races = useMemo(() => {
    return [...racesOriginalOrder].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  }, [racesOriginalOrder]);

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

  // Vérifier si on peut réorganiser (aucun classement existant)
  const hasAnyRanking = useMemo(() => {
    return engagements.some(e => e.rankingScratch != null);
  }, [engagements]);

  // Vérifier si des dossards sont dupliqués entre courses différentes
  const hasDuplicateRiderNumbers = useMemo(() => {
    const riderNumberToRaces = new Map<number, Set<string>>();
    for (const e of engagements) {
      if (e.riderNumber) {
        if (!riderNumberToRaces.has(e.riderNumber)) {
          riderNumberToRaces.set(e.riderNumber, new Set());
        }
        riderNumberToRaces.get(e.riderNumber)!.add(e.raceCode);
      }
    }
    // Si un dossard apparaît dans plusieurs courses, il y a duplication
    return Array.from(riderNumberToRaces.values()).some(racesSet => racesSet.size > 1);
  }, [engagements]);

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

  // Sélectionner le premier onglet après une réorganisation
  useEffect(() => {
    if (needsTabReset && races.length > 0) {
      setCurrentRaceCode(races[0]);
      navigate(`#${races[0]}`, { replace: true });
      setNeedsTabReset(false);
    }
  }, [needsTabReset, races, navigate]);

  // Changer de course
  const handleRaceChange = (raceCode: string) => {
    setCurrentRaceCode(raceCode);
    navigate(`#${raceCode}`, { replace: true });
  };

  // Compter les engagés par course et total
  const engagementsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const race of races) {
      counts[race] = engagements.filter(e => e.raceCode === race).length;
    }
    return counts;
  }, [engagements, races]);

  const totalEngagements = engagements.length;

  const toolbarLeft = competition ? (
    <div className="flex items-center gap-2">
      <h1 className="text-lg font-semibold">{competition.name}</h1>
      <Badge variant="outline">{totalEngagements} engagé{totalEngagements > 1 ? 's' : ''}</Badge>
    </div>
  ) : null;

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        disabled={hasAnyRanking || hasDuplicateRiderNumbers}
        onClick={() => setIsReorganizeOpen(true)}
        title={
          hasAnyRanking
            ? 'Impossible de réorganiser : des classements existent'
            : hasDuplicateRiderNumbers
              ? 'Impossible de réorganiser : des dossards sont attribués sur plusieurs courses'
              : 'Réorganiser les départs'
        }
      >
        <Shuffle className="h-4 w-4 mr-2" />
        Réorganiser les départs
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled title="Fonctionnalité à venir">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Engagements PDF</DropdownMenuItem>
          <DropdownMenuItem>Feuilles d'émargement PDF</DropdownMenuItem>
          <DropdownMenuItem>Engagements CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" onClick={() => navigate('/competitions')}>
        <ArrowLeft /> Retour
      </Button>
    </div>
  );

  const isLoading = isLoadingCompetition || isLoadingEngagements;

  if (isLoading && !competition) {
    return (
      <Layout title="Engagements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  if (!competition) {
    return (
      <Layout title="Engagements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8 text-destructive">
          Compétition non trouvée
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Engagements" toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <div className="space-y-2">
        {/* Onglets des courses */}
        {races.length > 0 && (
          <Tabs value={currentRaceCode} onValueChange={handleRaceChange} className="w-full">
            <div className="relative flex items-center gap-1">
              {/* Indicateur scroll gauche */}
              <div className={`shrink-0 transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsList
                ref={tabsRef}
                className="mb-0 flex w-full justify-start gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-x-auto scrollbar-none border-0"
              >
                {races.map(race => (
                  <TabsTrigger
                    key={race}
                    value={race}
                    className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                  >
                    <span className="text-base font-bold">{race}</span>
                    <Badge variant="secondary" className="text-xs">
                      {engagementsCount[race] || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Indicateur scroll droite */}
              <div className={`shrink-0 transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Tabs>
        )}

        {/* Formulaire d'engagement */}
        {currentRaceCode && (
          <EngagementForm
            competitionId={competition.id}
            competitionFede={competition.fede}
            competitionType={competition.competitionType as CompetitionTypeEnum}
            currentRaceCode={currentRaceCode}
            existingEngagements={engagements}
          />
        )}

        {/* Tableau des engagés */}
        {currentRaceCode && (
          <EngagementsTable
            engagements={engagements}
            currentRaceCode={currentRaceCode}
            competitionId={competition.id}
            isLoading={isLoadingEngagements}
          />
        )}
      </div>

      {/* Dialog de réorganisation */}
      <ReorganizeRacesDialog
        open={isReorganizeOpen}
        onOpenChange={setIsReorganizeOpen}
        competitionId={competition.id}
        currentRaces={racesOriginalOrder}
        engagements={engagements}
        onSuccess={() => setNeedsTabReset(true)}
      />
    </Layout>
  );
}
