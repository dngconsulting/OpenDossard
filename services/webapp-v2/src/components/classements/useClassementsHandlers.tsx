import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AppToast } from '@/components/ui/app-toast';
import {
  useReorderRankings,
  useToggleChallenge,
  useUpdateChrono,
  useUpdateRanking,
  useUpdateTours,
} from '@/hooks/useRaces';
import { type DNFCode, type DossardSubmitOutcome, type RaceRowType, type UpdateRankingDto, } from '@/types/races';
import { transformRows } from '@/utils/classements';

import type { DragEndEvent } from '@dnd-kit/core';

export function useClassementsHandlers(
  engagements: RaceRowType[],
  currentRaceCode: string,
  competitionId: number,
  dnfMode: DNFCode | null,
) {
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = toast.custom(toastId => <AppToast id={toastId} type={type} message={message} />);
    if (type === 'success') {
      setTimeout(() => toast.dismiss(id), 3000);
    }
  }, []);

  const updateRanking = useUpdateRanking();
  const updateChrono = useUpdateChrono();
  const updateTours = useUpdateTours();
  const toggleChallenge = useToggleChallenge();
  const reorderRankings = useReorderRankings();

  const rows = useMemo(
    () => transformRows(engagements, currentRaceCode),
    [engagements, currentRaceCode],
  );

  const raceEngagements = useMemo(
    () => engagements.filter(e => e.raceCode === currentRaceCode),
    [engagements, currentRaceCode],
  );

  const handleDossardSubmit = useCallback(
    async (position: number, value: string): Promise<DossardSubmitOutcome> => {
      const trimmed = value.trim();

      const dossardNum = parseInt(trimmed, 10);
      if (isNaN(dossardNum)) {
        return { markedDnf: false };
      }

      const engagement = raceEngagements.find(e => e.riderNumber === dossardNum);
      if (!engagement) {
        showToast('error', `Le dossard ${dossardNum} n'existe pas dans les engagés`);
        return { markedDnf: false };
      }

      // Garde-fou commun aux deux modes : on n'agit que sur un coureur vierge.
      // Ainsi le marquage DNF n'a jamais à déclasser/renuméroter (pas de
      // removeRanking) : la conversion d'un coureur déjà classé en DNF passe par
      // un déclassement préalable (poubelle groupée).
      const alreadyRanked = raceEngagements.find(
        e => e.riderNumber === dossardNum && (e.rankingScratch != null || e.comment != null),
      );
      if (alreadyRanked) {
        showToast(
          'error',
          `Le dossard ${dossardNum} est déjà ${alreadyRanked.comment != null ? `marqué ${alreadyRanked.comment}` : `classé en position ${alreadyRanked.rankingScratch}`}`,
        );
        return { markedDnf: false };
      }

      // Mode DNF armé (bouton « Saisir ABD/... ») → marquage direct par `comment`,
      // sans rankingScratch ni removeRanking.
      if (dnfMode) {
        const dto: UpdateRankingDto = {
          riderNumber: dossardNum,
          raceCode: currentRaceCode,
          competitionId,
          comment: dnfMode,
        };
        try {
          await updateRanking.mutateAsync(dto);
          showToast(
            'success',
            `Dossard ${dossardNum} - ${engagement.name} marqué ${dnfMode} (Le coureur est placé au fond du classement)`,
          );
          // Le coureur part dans la section DNF (bas du tableau) : on signale au
          // champ de se vider et de garder le focus (pas de saut au suivant).
          return { markedDnf: true };
        } catch {
          showToast('error', 'Impossible de marquer ce coureur');
          return { markedDnf: false };
        }
      }

      // Mode normal → classement via rankingScratch (rang suivant disponible).
      const nextRank =
        raceEngagements.filter(e => e.rankingScratch != null && e.comment == null).length + 1;

      const dto: UpdateRankingDto = {
        riderNumber: dossardNum,
        raceCode: currentRaceCode,
        competitionId,
        rankingScratch: nextRank,
      };

      try {
        await updateRanking.mutateAsync(dto);
        showToast('success', `${engagement.name} classé ${position}ème`);
      } catch {
        showToast('error', 'Impossible de mettre à jour le classement');
      }
      return { markedDnf: false };
    },
    [currentRaceCode, competitionId, raceEngagements, updateRanking, showToast, dnfMode],
  );

  const handleChronoSubmit = useCallback(
    async (id: number, chrono: string) => {
      try {
        await updateChrono.mutateAsync({ id, chrono, competitionId });
      } catch {
        showToast('error', 'Impossible de mettre à jour le chrono');
      }
    },
    [updateChrono, competitionId, showToast],
  );

  const handleToursSubmit = useCallback(
    async (id: number, tours: number | null) => {
      try {
        await updateTours.mutateAsync({ id, tours, competitionId });
      } catch {
        showToast('error', 'Impossible de mettre à jour les tours');
      }
    },
    [updateTours, competitionId, showToast],
  );

  const handleToggleChallenge = useCallback(
    async (id: number) => {
      try {
        await toggleChallenge.mutateAsync({ id, competitionId });
      } catch {
        showToast('error', 'Impossible de modifier le challenge');
      }
    },
    [toggleChallenge, competitionId, showToast],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const rankedRows = rows.filter(r => r.id != null);

      const oldIndex = rankedRows.findIndex(r => r.id?.toString() === active.id);
      const newIndex = rankedRows.findIndex(r => r.id?.toString() === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const movedRowId = parseInt(active.id as string, 10);
      const newRankedRows = arrayMove(rankedRows, oldIndex, newIndex);

      const items = newRankedRows.map(r => ({
        id: r.id!,
        comment: r.comment,
      }));

      setHighlightedRowId(movedRowId);

      try {
        await reorderRankings.mutateAsync({ items, competitionId });
        setTimeout(() => setHighlightedRowId(null), 1000);
      } catch {
        setHighlightedRowId(null);
        showToast('error', 'Impossible de réordonner les classements');
      }
    },
    [rows, competitionId, reorderRankings, showToast],
  );

  return {
    rows,
    highlightedRowId,
    handleDossardSubmit,
    handleChronoSubmit,
    handleToursSubmit,
    handleToggleChallenge,
    handleDragEnd,
  };
}
