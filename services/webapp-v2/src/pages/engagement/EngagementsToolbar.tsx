import { Pencil, RefreshCw, Shuffle, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { CompetitionOfficialsButton, ExportMenu, ImportMenu } from '@/components/engagements';
import { Button } from '@/components/ui/button';
import type { CompetitionDetailType } from '@/types/competitions';
import type { RaceRowType } from '@/types/races';

type Props = {
  competitionId: number | undefined;
  competition: CompetitionDetailType | undefined;
  engagements: RaceRowType[];
  races: string[];
  currentRaceCode: string;
  isPaymentsTab: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onReorganize: () => void;
};

/**
 * Barre d'actions de droite de l'écran des engagements (refresh, édition,
 * arbitres/commissaires, réorganiser, export, import, classements).
 */
export function EngagementsToolbar({
  competitionId,
  competition,
  engagements,
  races,
  currentRaceCode,
  isPaymentsTab,
  isRefreshing,
  onRefresh,
  onReorganize,
}: Props) {
  const navigate = useNavigate();
  const totalEngagements = engagements.length;

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

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Rafraîchir les données (engagements + paiements HelloAsso)"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
      {competition && (
        <Button
          variant="outline"
          onClick={() => navigate(`/competition/${competitionId}`)}
          title="Modifier l'épreuve"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {competition && <CompetitionOfficialsButton competition={competition} />}
      {!isPaymentsTab && (
        <>
          <Button
            variant="outline"
            disabled={hasAnyRanking || hasDuplicateRiderNumbers}
            onClick={onReorganize}
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
            onClick={() => navigate(`/competition/${competitionId}/classements#${currentRaceCode}`)}
            title={totalEngagements === 0 ? 'Aucun engagé' : 'Accéder aux classements'}
          >
            <Trophy className="h-4 w-4" />
            Classements
          </Button>
        </>
      )}
    </div>
  );
}
