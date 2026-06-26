import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableHead } from '@/components/ui/table';
import type { RowSelection } from '@/hooks/useRowSelection';
import { cn } from '@/lib/utils';

const COLUMN_WIDTH = 'w-[44px]';

/**
 * Case « tout cocher » de l'en-tête. Cochée si toutes les lignes
 * sélectionnables le sont, indéterminée (icône Minus) si seulement certaines.
 * Cliquer coche/décoche l'ensemble des `ids` fournis (lignes filtrées
 * sélectionnables de la vue courante).
 */
export function SelectAllCheckbox({ ids, selection }: { ids: number[]; selection: RowSelection }) {
  const allSelected = ids.length > 0 && ids.every(selection.isSelected);
  const someSelected = ids.some(selection.isSelected);
  const checked: boolean | 'indeterminate' = allSelected ? true : someSelected ? 'indeterminate' : false;

  return (
    <CheckboxPrimitive.Root
      checked={checked}
      disabled={ids.length === 0}
      onCheckedChange={value => selection.toggleAll(ids, value === true)}
      aria-label="Tout sélectionner"
      className={cn(
        'peer border-slate-400 dark:border-slate-500 dark:bg-input/30 size-4 shrink-0 rounded-[4px] border shadow-xs outline-none',
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary',
        'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-shadow',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
        {checked === 'indeterminate' ? <MinusIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/** Case d'une ligne sélectionnable. */
export function RowSelectCheckbox({ id, selection }: { id: number; selection: RowSelection }) {
  return (
    <Checkbox
      checked={selection.isSelected(id)}
      onCheckedChange={() => selection.toggle(id)}
      aria-label="Sélectionner la ligne"
      className="border-slate-400 dark:border-slate-500"
    />
  );
}

/**
 * Cellule d'en-tête (`<TableHead>`) contenant la case « tout cocher ».
 * `hidden` masque la case (cellule conservée pour l'alignement des colonnes)
 * — utilisé quand une autre action exclusive est en cours (ex. mode DNF armé).
 */
export function SelectionHeaderCell({
  ids,
  selection,
  className,
  hidden = false,
}: {
  ids: number[];
  selection: RowSelection;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <TableHead className={cn(COLUMN_WIDTH, 'text-center', className)}>
      {!hidden && (
        <div className="flex items-center justify-center">
          <SelectAllCheckbox ids={ids} selection={selection} />
        </div>
      )}
    </TableHead>
  );
}

/**
 * Cellule de ligne (`<TableCell>`) avec la case de sélection. Si `id` est
 * absent (ligne non sélectionnable, ex. emplacement vide ou coureur classé
 * non désengageable), la cellule reste vide pour conserver l'alignement.
 */
export function SelectionCell({
  id,
  selection,
  className,
  hidden = false,
}: {
  id: number | null | undefined;
  selection: RowSelection;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <TableCell className={cn(COLUMN_WIDTH, 'text-center', className)}>
      {id != null && !hidden && (
        <div className="flex items-center justify-center">
          <RowSelectCheckbox id={id} selection={selection} />
        </div>
      )}
    </TableCell>
  );
}
