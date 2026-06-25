import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Pencil, RefreshCw, Shuffle, Trophy } from 'lucide-react';
import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';

import { BulkDeleteToolbarButton } from '@/components/common/BulkDeleteToolbarButton';
import { HelloAssoTabIcon } from '@/components/common/HelloAssoTabIcon';
import { PaymentsTable } from '@/components/data/PaymentsTable';
import { EngagementForm, EngagementsTable, ExportMenu, ImportMenu, ReorganizeRacesDialog } from '@/components/engagements';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RaceTabsList, RaceTabsTrigger } from '@/components/ui/race-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { type CompetitionType as CompetitionTypeEnum } from '@/config/federations';
import { useBulkRowAction } from '@/hooks/useBulkRowAction';
import { useCompetition } from '@/hooks/useCompetitions';
import { usePaymentsHasAny } from '@/hooks/usePayments';
import { useCompetitionRaces, useBulkDeleteRaces } from '@/hooks/useRaces';

/**
 * Sentinel pour l'onglet "Paiements HelloAsso" — préfixe `__` évite toute
 * collision avec un raceCode utilisateur. Sync URL via `#payments`.
 */
const PAYMENTS_TAB_VALUE = '__payments__';
const PAYMENTS_HASH = 'payments';

export default function EngagementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const competitionId = id ? parseInt(id, 10) : undefined;

  // Récupérer la course depuis le hash de l'URL
  const [currentRaceCode, setCurrentRaceCode] = useState<string>('');
  const [isReorganizeOpen, setIsReorganizeOpen] = useState(false);
  const [needsTabReset, setNeedsTabReset] = useState(false);

  // Sélection de lignes + désengagement groupé (logique mutualisée)
  const bulkDelete = useBulkDeleteRaces();
  const {
    selection,
    count: selectionCount,
    isPending: isBulkDeleting,
    handleConfirm: handleBulkDelete,
  } = useBulkRowAction({
    resetKey: currentRaceCode,
    buildVars: ids => (competitionId === undefined ? null : { ids, competitionId }),
    mutateAsync: bulkDelete.mutateAsync,
    isPending: bulkDelete.isPending,
    successMessage: n => `${n} coureur(s) désengagé(s)`,
    errorMessage: 'Échec du désengagement groupé : aucune ligne supprimée',
  });

  const tabsRef = useRef<HTMLDivElement>(null);

  // Charger les données
  const { data: competition, isLoading: isLoadingCompetition } = useCompetition(competitionId);
  const { data: engagements = [], isLoading: isLoadingEngagements, refetch: refetchEngagements, isFetching: isFetchingEngagements } =
    useCompetitionRaces(competitionId);

  // Onglet Paiements affiché UNIQUEMENT si la compétition a au moins un paiement
  // HelloAsso (indépendamment du club lié ou de `onlineRegistrationEnabled`).
  // Évite de polluer l'UI quand aucune transaction n'existe (cas 99% des compets).
  // Scope = `null` tant que competitionId n'est pas connu → query désactivée.
  const { hasAny: hasPayments } = usePaymentsHasAny(
    competitionId !== undefined ? { kind: 'competition', competitionId } : null,
  );
  const showPaymentsTab = competitionId !== undefined && hasPayments;

  // Liste des courses dans l'ordre original (pour la réorganisation)
  // races peut être un string (comma-separated) ou déjà un array
  const racesOriginalOrder = useMemo(() => {
    if (!competition?.races) {return [];}
    const racesArray = typeof competition.races === 'string'
      ? competition.races.split(',').map(r => r.trim()).filter(Boolean)
      : competition.races;
    return racesArray;
  }, [competition?.races]);

  // Liste des courses triées pour l'affichage des onglets
  const races = useMemo(() => {
    return [...racesOriginalOrder].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  }, [racesOriginalOrder]);

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

  // Synchroniser le hash avec la course courante. Gère 4 cas :
  //  - hash = raceCode connu → activer cette course
  //  - hash = "payments" ET tab autorisé (≥1 paiement) → activer l'onglet paiements
  //  - hash = "payments" mais tab caché (0 paiement) → fallback 1ère course
  //  - hash absent / inconnu → activer la 1ère course (default)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === PAYMENTS_HASH && showPaymentsTab) {
      setCurrentRaceCode(PAYMENTS_TAB_VALUE);
    } else if (hash && races.includes(hash)) {
      setCurrentRaceCode(hash);
    } else if (races.length > 0 && (!currentRaceCode || currentRaceCode === PAYMENTS_TAB_VALUE)) {
      // currentRaceCode peut être en PAYMENTS_TAB_VALUE puis le tab disparaît
      // (refetch hasAny qui passe à false) — bascule alors sur la 1ère course.
      setCurrentRaceCode(races[0]);
      navigate(`#${races[0]}`, { replace: true });
    }
  }, [location.hash, races, currentRaceCode, navigate, showPaymentsTab]);

  // Sélectionner le premier onglet après une réorganisation
  useEffect(() => {
    if (needsTabReset && races.length > 0) {
      setCurrentRaceCode(races[0]);
      navigate(`#${races[0]}`, { replace: true });
      setNeedsTabReset(false);
    }
  }, [needsTabReset, races, navigate]);

  // Changer de course (ou basculer sur l'onglet Paiements)
  const handleRaceChange = (raceCode: string) => {
    setCurrentRaceCode(raceCode);
    const hash = raceCode === PAYMENTS_TAB_VALUE ? PAYMENTS_HASH : raceCode;
    navigate(`#${hash}`, { replace: true });
  };

  const isPaymentsTab = currentRaceCode === PAYMENTS_TAB_VALUE;

  // Refresh combiné : engagements + paiements HelloAsso. Uniquement sur cet écran
  // (l'écran Classements n'utilise PAS ce handler — pas de pollution HelloAsso là-bas).
  // `invalidateQueries({ queryKey: ['payments'] })` couvre les 2 queries posées
  // par les hooks `usePayments` (grid) ET `usePaymentsHasAny` (visibilité tab).
  const handleRefresh = useCallback(() => {
    void refetchEngagements();
    void queryClient.invalidateQueries({ queryKey: ['payments'] });
  }, [refetchEngagements, queryClient]);

  // Compter les engagés par course et total
  const engagementsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const race of races) {
      counts[race] = engagements.filter(e => e.raceCode === race).length;
    }
    return counts;
  }, [engagements, races]);

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
      <span className="text-muted-foreground">Engagements</span>
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
          {totalEngagements} engagé{totalEngagements > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );

  // Dès qu'au moins une ligne est cochée, on masque toute la barre de droite
  // (refresh, édition, réorganiser, export, import, classements) pour éviter
  // les conflits d'action : seule la poubelle groupée reste accessible.
  const toolbar = selectionCount > 0 ? (
    <BulkDeleteToolbarButton
      count={selectionCount}
      actionLabel="Désengager"
      onConfirm={handleBulkDelete}
      isPending={isBulkDeleting}
    />
  ) : (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        onClick={handleRefresh}
        disabled={isFetchingEngagements}
        title="Rafraîchir les données (engagements + paiements HelloAsso)"
      >
        <RefreshCw className={`h-4 w-4 ${isFetchingEngagements ? 'animate-spin' : ''}`} />
      </Button>
      {competition && (
        <Button
          variant="outline"
          onClick={() => navigate(`/competition/${id}`)}
          title="Modifier l'épreuve"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {!isPaymentsTab && (
        <>
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
          {competition && currentRaceCode && (
            <ExportMenu
              engagements={engagements}
              currentRaceCode={currentRaceCode}
              races={races}
              competition={competition}
            />
          )}
          {competition && <ImportMenu competitionId={competition.id} />}
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-600/50"
            disabled={totalEngagements === 0}
            onClick={() => navigate(`/competition/${id}/classements#${currentRaceCode}`)}
            title={totalEngagements === 0 ? 'Aucun engagé' : 'Accéder aux classements'}
          >
            <Trophy className="h-4 w-4" />
            Classements
          </Button>
        </>
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
      <div>
        {/* Onglets des courses */}
        {races.length > 0 && (
          <Tabs value={currentRaceCode} onValueChange={handleRaceChange} className="w-full">
            <RaceTabsList ref={tabsRef}>
              {races.map(race => (
                <RaceTabsTrigger key={race} value={race} className="px-6">
                  <span className="text-base font-bold">{race}</span>
                  <Badge variant="secondary" className="text-xs">
                    {engagementsCount[race] || 0}
                  </Badge>
                </RaceTabsTrigger>
              ))}
              {showPaymentsTab && (
                <RaceTabsTrigger value={PAYMENTS_TAB_VALUE} className="px-4">
                  <HelloAssoTabIcon />
                </RaceTabsTrigger>
              )}
            </RaceTabsList>
          </Tabs>
        )}

        {/* Onglet Paiements : grid de transactions HelloAsso pour cette compétition. */}
        {isPaymentsTab && (
          <PaymentsTable scope={{ kind: 'competition', competitionId: competition.id }} />
        )}

        {/* Formulaire d'engagement (masqué sur l'onglet Paiements) */}
        {!isPaymentsTab && currentRaceCode && (
          <EngagementForm
            competitionId={competition.id}
            competitionFede={competition.fede}
            competitionType={competition.competitionType as CompetitionTypeEnum}
            currentRaceCode={currentRaceCode}
            existingEngagements={engagements}
          />
        )}

        {/* Tableau des engagés (masqué sur l'onglet Paiements) */}
        {!isPaymentsTab && currentRaceCode && (
          <EngagementsTable
            engagements={engagements}
            currentRaceCode={currentRaceCode}
            competitionId={competition.id}
            selection={selection}
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
