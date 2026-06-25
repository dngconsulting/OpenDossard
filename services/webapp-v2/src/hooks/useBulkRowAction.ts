import { useCallback, useEffect } from 'react';

import { showAppToast } from '@/lib/toast';

import { useRowSelection, type RowSelection } from './useRowSelection';

type BulkRowActionConfig<V> = {
  /** La sélection est remise à zéro à chaque changement de cette valeur (ex: onglet course). */
  resetKey: unknown;
  /** Construit les variables de mutation depuis les ids cochés ; `null` annule (contexte incomplet). */
  buildVars: (ids: number[]) => V | null;
  /** Mutation atomique côté serveur ; retourne le nombre de lignes réellement traitées. */
  mutateAsync: (vars: V) => Promise<{ count: number }>;
  isPending: boolean;
  /** Message de succès, construit depuis le `count` FAISANT AUTORITÉ renvoyé par le serveur. */
  successMessage: (count: number) => string;
  errorMessage: string;
};

export type BulkRowAction = {
  selection: RowSelection;
  count: number;
  isPending: boolean;
  handleConfirm: () => Promise<void>;
};

/**
 * Mutualise la logique d'action groupée des écrans Engagements/Classements :
 * sélection de lignes, remise à zéro au changement de contexte, et confirmation
 * (garde-fous, appel atomique, toast bâti sur le compte serveur, reset). Chaque
 * page ne garde que le câblage de `selection` vers sa table et le basculement de
 * sa toolbar quand `count > 0`.
 */
export function useBulkRowAction<V>({
  resetKey,
  buildVars,
  mutateAsync,
  isPending,
  successMessage,
  errorMessage,
}: BulkRowActionConfig<V>): BulkRowAction {
  const selection = useRowSelection();
  const { clear, selectedIds } = selection;

  useEffect(() => {
    clear();
  }, [resetKey, clear]);

  const handleConfirm = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      return;
    }
    const vars = buildVars(ids);
    if (vars == null) {
      return;
    }
    try {
      const { count } = await mutateAsync(vars);
      clear();
      showAppToast('success', successMessage(count));
    } catch {
      showAppToast('error', errorMessage);
    }
  }, [selectedIds, buildVars, mutateAsync, clear, successMessage, errorMessage]);

  return { selection, count: selection.count, isPending, handleConfirm };
}
