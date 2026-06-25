import { useCallback, useMemo, useState } from 'react';

/**
 * Sélection de lignes par identifiant numérique, partagée entre une table
 * (rendu des cases à cocher + « tout cocher ») et la toolbar de la page
 * (compteur → affichage de l'action groupée + masquage des autres boutons).
 *
 * L'état vit dans la page (la toolbar a besoin du `count`) et est passé à la
 * table. La table connaît ses lignes sélectionnables et pilote le « tout
 * cocher » via `toggleAll`, le hook restant agnostique des données.
 */
export type RowSelection = {
  selectedIds: Set<number>;
  count: number;
  isSelected: (id: number) => boolean;
  toggle: (id: number) => void;
  /** Coche (`checked=true`) ou décoche tous les ids fournis, en une passe. */
  toggleAll: (ids: number[], checked: boolean) => void;
  clear: () => void;
};

export function useRowSelection(): RowSelection {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const toggle = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: number[], checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(prev => (prev.size === 0 ? prev : new Set()));
  }, []);

  const isSelected = useCallback((id: number) => selectedIds.has(id), [selectedIds]);

  return useMemo(
    () => ({ selectedIds, count: selectedIds.size, isSelected, toggle, toggleAll, clear }),
    [selectedIds, isSelected, toggle, toggleAll, clear],
  );
}
