import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Medal } from 'lucide-react';
import { useCallback } from 'react';

import { SelectionCell } from '@/components/common/RowSelection';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RowSelection } from '@/hooks/useRowSelection';
import { cn } from '@/lib/utils';
import type { TransformedRow } from '@/utils/classements';
import { formatRanking } from '@/utils/classements';

import { PodiumIcon } from './PodiumIcon';
import { RankingInput } from './RankingInput';

export type SortableRowProps = {
  row: TransformedRow;
  avecChrono: boolean;
  onDossardSubmit: (position: number, value: string) => void;
  onChronoSubmit: (id: number, chrono: string) => void;
  onToursSubmit: (id: number, tours: number | null) => void;
  onToggleChallenge: (id: number) => void;
  selection: RowSelection;
  rowIndex: number;
  totalRows: number;
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  isHighlighted?: boolean;
};

export function SortableRow({
  row,
  avecChrono,
  onDossardSubmit,
  onChronoSubmit,
  onToursSubmit,
  onToggleChallenge,
  selection,
  rowIndex,
  totalRows,
  inputRefs,
  isHighlighted,
}: SortableRowProps) {
  const isDraggable = row.id != null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id?.toString() ?? `empty-${row.position}`,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = row.id != null && selection.isSelected(row.id);

  const navigateDown = useCallback(() => {
    if (rowIndex < totalRows - 1) {
      const nextKey = `dossard-${rowIndex + 1}`;
      inputRefs.current.get(nextKey)?.focus();
    }
  }, [rowIndex, totalRows, inputRefs]);

  const navigateNext = useCallback(() => {
    if (avecChrono && row.id) {
      const chronoKey = `chrono-${rowIndex}`;
      inputRefs.current.get(chronoKey)?.focus();
    } else if (rowIndex < totalRows - 1) {
      const nextKey = `dossard-${rowIndex + 1}`;
      inputRefs.current.get(nextKey)?.focus();
    }
  }, [avecChrono, row.id, rowIndex, totalRows, inputRefs]);

  const setInputRef = useCallback(
    (key: string) => (el: HTMLInputElement | null) => {
      if (el) {
        inputRefs.current.set(key, el);
      } else {
        inputRefs.current.delete(key);
      }
    },
    [inputRefs]
  );

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-colors duration-700',
        isDragging && 'bg-muted',
        // `!` pour battre la zébrure nth-child du TableBody (plus spécifique)
        isSelected && '!bg-primary/10 hover:!bg-primary/15',
        isHighlighted && '!bg-orange-200 dark:!bg-orange-800/50',
        !row.riderNumber && 'text-muted-foreground'
      )}
    >
      {/* Grip handle */}
      <TableCell className="w-[40px] p-1 hidden sm:table-cell">
        {isDraggable && (
          <button
            type="button"
            className="cursor-grab touch-none p-1.5 rounded-md hover:bg-accent transition-colors"
            {...attributes}
            {...listeners}
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </TableCell>

      {/* Sélection (case seulement si la ligne porte un coureur) */}
      <SelectionCell id={row.id ?? null} selection={selection} />

      {/* Classement */}
      <TableCell className="w-[80px] text-center font-mono">
        {row.comment ? (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 font-semibold">
            {row.comment}
          </Badge>
        ) : (
          formatRanking(row)
        )}
      </TableCell>

      {/* Dossard (input) */}
      <TableCell className="w-[100px] p-1">
        <RankingInput
          value={row.riderNumber?.toString().padStart(3, '0') ?? ''}
          onSubmit={(value) => onDossardSubmit(row.position, value)}
          onNavigateDown={navigateDown}
          onNavigateNext={navigateNext}
          placeholder="---"
        />
      </TableCell>

      {/* Chrono (si avecChrono) */}
      {avecChrono && (
        <TableCell className="w-[150px] p-1">
          {row.id && (
            <Input
              ref={setInputRef(`chrono-${rowIndex}`)}
              type="text"
              placeholder="00:00:00:00"
              defaultValue={row.chrono ?? ''}
              className="h-8 w-[130px] text-center font-mono"
              onBlur={(e) => {
                if (e.target.value !== row.chrono) {
                  onChronoSubmit(row.id!, e.target.value);
                }
              }}
            />
          )}
        </TableCell>
      )}

      {/* Tours (si avecChrono) */}
      {avecChrono && (
        <TableCell className="w-[80px] p-1">
          {row.id && (
            <Input
              ref={setInputRef(`tours-${rowIndex}`)}
              type="number"
              min={0}
              defaultValue={row.tours ?? ''}
              className="h-8 w-16 text-center font-mono"
              onBlur={(e) => {
                const newTours = e.target.value ? parseInt(e.target.value, 10) : null;
                if (newTours !== row.tours) {
                  onToursSubmit(row.id!, newTours);
                }
              }}
            />
          )}
        </TableCell>
      )}

      {/* Coureur + icônes */}
      <TableCell className="w-[150px]">
        {row.name && (
          <div className="flex items-center gap-1">
            <PodiumIcon
              rankingScratch={row.rankingScratch}
              rankOfCate={row.rankOfCate}
            />
            {row.sprintchallenge && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Medal className="h-4 w-4 text-blue-600 mr-1 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vainqueur du challenge sprint</p>
                </TooltipContent>
              </Tooltip>
            )}
            <span className="truncate" title={row.name}>{row.name}</span>
          </div>
        )}
      </TableCell>

      {/* Club */}
      <TableCell className="w-[120px]">
        <span className="block truncate" title={row.club ?? ''}>{row.club}</span>
      </TableCell>

      {/* H/F */}
      <TableCell className="w-[50px] text-center hidden sm:table-cell">{row.gender}</TableCell>

      {/* Dept */}
      <TableCell className="w-[60px] text-center hidden sm:table-cell">{row.dept}</TableCell>

      {/* Année */}
      <TableCell className="w-[60px] text-center hidden sm:table-cell">{row.birthYear}</TableCell>

      {/* CatéA */}
      <TableCell className="w-[70px] text-center hidden sm:table-cell">{row.catea}</TableCell>

      {/* CatéV */}
      <TableCell className="w-[70px] text-center">{row.catev}</TableCell>

      {/* Fédé */}
      <TableCell className="w-[70px] text-center">{row.fede}</TableCell>

      {/* Actions (toggle challenge) */}
      <TableCell className="w-[80px] p-1">
        {row.id && (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  className={cn(
                    'p-1.5 rounded-md hover:bg-accent transition-colors',
                    row.sprintchallenge && 'text-blue-600'
                  )}
                  onClick={() => onToggleChallenge(row.id!)}
                >
                  <Medal className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {row.sprintchallenge
                    ? 'Retirer du challenge sprint'
                    : 'Marquer vainqueur challenge sprint'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
