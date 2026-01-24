import { useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Medal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppToast } from '@/components/ui/app-toast';
import {
  useUpdateRanking,
  useUpdateChrono,
  useUpdateTours,
  useToggleChallenge,
  useReorderRankings,
  useRemoveRanking,
} from '@/hooks/useRaces';
import type { RaceRowType, UpdateRankingDto } from '@/types/races';
import { DNF_CODES, type DNFCode } from '@/types/races';
import { transformRows, formatRanking, type TransformedRow } from '@/utils/classements';
import { cn } from '@/lib/utils';

import { RankingInput } from './RankingInput';
import { PodiumIcon } from './PodiumIcon';

type ClassementsTableProps = {
  engagements: RaceRowType[];
  currentRaceCode: string;
  competitionId: number;
  avecChrono: boolean;
  isLoading?: boolean;
};

// Composant ligne triable
function SortableRow({
  row,
  avecChrono,
  currentRaceCode,
  onDossardSubmit,
  onChronoSubmit,
  onToursSubmit,
  onToggleChallenge,
  onRemoveRanking,
  rowIndex,
  totalRows,
  inputRefs,
}: {
  row: TransformedRow;
  avecChrono: boolean;
  currentRaceCode: string;
  onDossardSubmit: (position: number, value: string) => void;
  onChronoSubmit: (id: number, chrono: string) => void;
  onToursSubmit: (id: number, tours: number | null) => void;
  onToggleChallenge: (id: number) => void;
  onRemoveRanking: (id: number, raceCode: string) => void;
  rowIndex: number;
  totalRows: number;
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
}) {
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
        isDragging && 'bg-muted',
        !row.riderNumber && 'text-muted-foreground'
      )}
    >
      {/* Grip handle */}
      <TableCell className="w-[40px] p-1 hidden sm:table-cell">
        {isDraggable && (
          <button
            type="button"
            className="cursor-grab touch-none p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </TableCell>

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
        <TableCell className="w-[100px] p-1">
          {row.id && (
            <Input
              ref={setInputRef(`chrono-${rowIndex}`)}
              type="time"
              step="1"
              tabIndex={-1}
              defaultValue={row.chrono ?? ''}
              className="h-8 w-24 text-center font-mono"
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
        <TableCell className="w-[70px] p-1">
          {row.id && (
            <Input
              ref={setInputRef(`tours-${rowIndex}`)}
              type="number"
              min={0}
              tabIndex={-1}
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
      <TableCell>
        {row.name && (
          <div className="flex items-center gap-1 max-w-[200px]">
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
      <TableCell>
        <span className="block truncate max-w-[150px]" title={row.club ?? ''}>{row.club}</span>
      </TableCell>

      {/* H/F */}
      <TableCell className="w-[50px] text-center hidden sm:table-cell">{row.gender}</TableCell>

      {/* Dept */}
      <TableCell className="w-[60px] text-center hidden sm:table-cell">{row.dept}</TableCell>

      {/* CatéV */}
      <TableCell className="w-[70px] text-center">{row.catev}</TableCell>

      {/* Fédé */}
      <TableCell className="w-[70px] text-center">{row.fede}</TableCell>

      {/* Actions (toggle challenge + supprimer) */}
      <TableCell className="w-[80px] p-1">
        {row.id && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  className={cn(
                    'p-1 rounded hover:bg-muted',
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  className="p-1 rounded hover:bg-muted text-destructive hover:text-destructive"
                  onClick={() => onRemoveRanking(row.id!, currentRaceCode)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retirer du classement</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ClassementsTable({
  engagements,
  currentRaceCode,
  competitionId,
  avecChrono,
  isLoading,
}: ClassementsTableProps) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = toast.custom((toastId) => <AppToast id={toastId} type={type} message={message} />);
    if (type === 'success') {
      setTimeout(() => toast.dismiss(id), 1000);
    }
  }, []);

  // Mutations
  const updateRanking = useUpdateRanking();
  const updateChrono = useUpdateChrono();
  const updateTours = useUpdateTours();
  const toggleChallenge = useToggleChallenge();
  const reorderRankings = useReorderRankings();
  const removeRanking = useRemoveRanking();

  // Transformer les données pour l'affichage
  const rows = useMemo(
    () => transformRows(engagements, currentRaceCode),
    [engagements, currentRaceCode]
  );

  // IDs pour le drag & drop (seulement les lignes avec id)
  const sortableIds = useMemo(
    () => rows.map((r) => r.id?.toString() ?? `empty-${r.position}`),
    [rows]
  );

  // Sensors pour drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Engagés de la course courante (pour validation dossard)
  const raceEngagements = useMemo(
    () => engagements.filter((e) => e.raceCode === currentRaceCode),
    [engagements, currentRaceCode]
  );

  // Gérer la soumission d'un dossard
  const handleDossardSubmit = useCallback(
    async (position: number, value: string) => {
      const trimmed = value.trim().toUpperCase();

      // Si c'est un code DNF
      if (DNF_CODES.includes(trimmed as DNFCode)) {
        // Trouver la ligne existante à cette position
        const existingRow = rows.find((r) => r.position === position && r.id);
        if (existingRow?.id) {
          try {
            // Si le coureur est déjà classé, d'abord supprimer son classement
            if (existingRow.rankingScratch != null || existingRow.comment != null) {
              await removeRanking.mutateAsync({
                id: existingRow.id,
                raceCode: currentRaceCode,
                competitionId,
              });
            }

            // Puis mettre à jour avec le code DNF
            const dto: UpdateRankingDto = {
              riderNumber: existingRow.riderNumber!,
              raceCode: currentRaceCode,
              competitionId,
              comment: trimmed,
            };
            await updateRanking.mutateAsync(dto);
            showToast('success', `Dossard ${existingRow.riderNumber} - ${existingRow.name} marqué ${trimmed}`);
          } catch {
            showToast('error', 'Impossible de mettre à jour le classement');
          }
        }
        return;
      }

      // Sinon, c'est un numéro de dossard
      const dossardNum = parseInt(trimmed, 10);
      if (isNaN(dossardNum)) {
        return;
      }

      // Vérifier que le dossard existe dans les engagés
      const engagement = raceEngagements.find((e) => e.riderNumber === dossardNum);
      if (!engagement) {
        showToast('error', `Le dossard ${dossardNum} n'existe pas dans les engagés`);
        return;
      }

      // Vérifier que le dossard n'est pas déjà classé
      const alreadyRanked = raceEngagements.find(
        (e) =>
          e.riderNumber === dossardNum &&
          (e.rankingScratch != null || e.comment != null)
      );
      if (alreadyRanked) {
        showToast('error', `Le dossard ${dossardNum} est déjà classé en position ${alreadyRanked.rankingScratch ?? alreadyRanked.comment}`);
        return;
      }

      // Mettre à jour le classement
      const dto: UpdateRankingDto = {
        riderNumber: dossardNum,
        raceCode: currentRaceCode,
        competitionId,
        rankingScratch: position,
      };

      try {
        await updateRanking.mutateAsync(dto);
        showToast('success', `${engagement.name} classé ${position}ème`);
      } catch {
        showToast('error', 'Impossible de mettre à jour le classement');
      }
    },
    [rows, currentRaceCode, competitionId, raceEngagements, updateRanking, showToast]
  );

  // Gérer la soumission d'un chrono
  const handleChronoSubmit = useCallback(
    async (id: number, chrono: string) => {
      try {
        await updateChrono.mutateAsync({ id, chrono, competitionId });
      } catch {
        showToast('error', 'Impossible de mettre à jour le chrono');
      }
    },
    [updateChrono, competitionId, showToast]
  );

  // Gérer la soumission des tours
  const handleToursSubmit = useCallback(
    async (id: number, tours: number | null) => {
      try {
        await updateTours.mutateAsync({ id, tours, competitionId });
      } catch {
        showToast('error', 'Impossible de mettre à jour les tours');
      }
    },
    [updateTours, competitionId, showToast]
  );

  // Gérer le toggle challenge
  const handleToggleChallenge = useCallback(
    async (id: number) => {
      try {
        await toggleChallenge.mutateAsync({ id, competitionId });
      } catch {
        showToast('error', 'Impossible de modifier le challenge');
      }
    },
    [toggleChallenge, competitionId, showToast]
  );

  // Gérer la suppression du classement
  const handleRemoveRanking = useCallback(
    async (id: number, raceCode: string) => {
      const row = rows.find((r) => r.id === id);
      try {
        await removeRanking.mutateAsync({ id, raceCode, competitionId });
        showToast('success', `Dossard ${row?.riderNumber} - ${row?.name} retiré du classement`);
      } catch {
        showToast('error', 'Impossible de retirer le coureur du classement');
      }
    },
    [removeRanking, competitionId, showToast, rows]
  );

  // Gérer le drag & drop
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Récupérer les lignes classées (avec id)
      const rankedRows = rows.filter((r) => r.id != null);

      // Trouver les indices dans le tableau des classés
      const oldIndex = rankedRows.findIndex(
        (r) => r.id?.toString() === active.id
      );
      const newIndex = rankedRows.findIndex(
        (r) => r.id?.toString() === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return;

      // Réordonner avec arrayMove
      const newRankedRows = arrayMove(rankedRows, oldIndex, newIndex);

      // Créer les items pour l'API (ordre du tableau = nouveau classement)
      const items = newRankedRows.map((r) => ({
        id: r.id!,
        comment: r.comment,
      }));

      try {
        await reorderRankings.mutateAsync({ items, competitionId });
      } catch {
        showToast('error', 'Impossible de réordonner les classements');
      }
    },
    [rows, competitionId, reorderRankings, showToast]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Chargement des classements...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Aucun engagé dans cette course
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] hidden sm:table-cell"></TableHead>
                <TableHead className="w-[80px] text-center">Clt</TableHead>
                <TableHead className="w-[100px]">Dossard</TableHead>
                {avecChrono && <TableHead className="w-[100px]">Chrono</TableHead>}
                {avecChrono && <TableHead className="w-[70px]">Tours</TableHead>}
                <TableHead>Coureur</TableHead>
                <TableHead>Club</TableHead>
                <TableHead className="w-[50px] text-center hidden sm:table-cell">H/F</TableHead>
                <TableHead className="w-[60px] text-center hidden sm:table-cell">Dept</TableHead>
                <TableHead className="w-[70px] text-center">CatéV</TableHead>
                <TableHead className="w-[70px] text-center">Fédé</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <SortableRow
                  key={row.id ?? `empty-${row.position}`}
                  row={row}
                  avecChrono={avecChrono}
                  currentRaceCode={currentRaceCode}
                  onDossardSubmit={handleDossardSubmit}
                  onChronoSubmit={handleChronoSubmit}
                  onToursSubmit={handleToursSubmit}
                  onToggleChallenge={handleToggleChallenge}
                  onRemoveRanking={handleRemoveRanking}
                  rowIndex={index}
                  totalRows={rows.length}
                  inputRefs={inputRefs}
                />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
    </div>
  );
}
