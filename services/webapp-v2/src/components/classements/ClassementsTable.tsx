import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { SelectionHeaderCell } from '@/components/common/RowSelection';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableFilter,
  TableFilterCell,
  TableFilterRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RowSelection } from '@/hooks/useRowSelection';
import type { RaceRowType, DNFCode } from '@/types/races';
import type { TransformedRow } from '@/utils/classements';

import { SortableRow } from './SortableRow';
import { useClassementsHandlers } from './useClassementsHandlers';

function FilterCell({ column, value, onChange }: { column: string; value?: string; onChange: (col: string, val: string) => void }) {
  return (
    <TableFilterCell>
      <div className="relative">
        {!value && (
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
        )}
        <Input
          value={value || ''}
          onChange={e => onChange(column, e.target.value)}
          className={`h-8 text-sm ${value ? 'pl-2 pr-7' : 'pl-6'} bg-background/80 border-border/50 focus:border-primary/50`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(column, '')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </TableFilterCell>
  );
}

type ClassementsTableProps = {
  engagements: RaceRowType[];
  currentRaceCode: string;
  competitionId: number;
  avecChrono: boolean;
  selection: RowSelection;
  /** Statut DNF armé via la toolbar (null = classement normal). */
  dnfMode: DNFCode | null;
  isLoading?: boolean;
};

export function ClassementsTable({
  engagements,
  currentRaceCode,
  competitionId,
  avecChrono,
  selection,
  dnfMode,
  isLoading,
}: ClassementsTableProps) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = useCallback((column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  const {
    rows,
    highlightedRowId,
    handleDossardSubmit,
    handleChronoSubmit,
    handleToursSubmit,
    handleToggleChallenge,
    handleDragEnd,
  } = useClassementsHandlers(engagements, currentRaceCode, competitionId, dnfMode);

  // Filtrer les lignes
  const filteredRows = useMemo(() => {
    const hasFilters = Object.values(filters).some(v => v);
    if (!hasFilters) {return rows;}
    return rows.filter(row => {
      for (const [col, filterValue] of Object.entries(filters)) {
        if (!filterValue) {continue;}
        const raw = row[col as keyof TransformedRow];
        const cellValue = col === 'riderNumber' && raw != null
          ? String(raw).padStart(3, '0')
          : String(raw ?? '');
        if (!cellValue.toLowerCase().includes(filterValue.toLowerCase())) {return false;}
      }
      return true;
    });
  }, [rows, filters]);

  // IDs pour le drag & drop
  const sortableIds = useMemo(
    () => filteredRows.map((r) => r.id?.toString() ?? `empty-${r.position}`),
    [filteredRows]
  );

  // Ids ciblés par « tout cocher » : lignes visibles portant un coureur.
  const selectableIds = useMemo(
    () => filteredRows.map((r) => r.id).filter((id): id is number => id != null),
    [filteredRows]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    <div className="rounded-md border flex flex-col max-h-[calc(100vh-280px)]">
      <div className="overflow-auto flex-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <Table className="min-w-[950px]">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="w-[40px] hidden sm:table-cell" />
                <SelectionHeaderCell ids={selectableIds} selection={selection} hidden={dnfMode !== null} />
                <TableHead className="w-[80px] text-center">Clt</TableHead>
                <TableHead className="w-[100px]">Dossard</TableHead>
                {avecChrono && <TableHead className="w-[150px]">Chrono</TableHead>}
                {avecChrono && <TableHead className="w-[80px]">Tours</TableHead>}
                <TableHead className="w-[150px]">Coureur</TableHead>
                <TableHead className="w-[120px]">Club</TableHead>
                <TableHead className="w-[50px] text-center hidden sm:table-cell">H/F</TableHead>
                <TableHead className="w-[60px] text-center hidden sm:table-cell">Dept</TableHead>
                <TableHead className="w-[60px] text-center hidden sm:table-cell">Année</TableHead>
                <TableHead className="w-[70px] text-center hidden sm:table-cell">Caté.A</TableHead>
                <TableHead className="w-[70px] text-center">CatéV</TableHead>
                <TableHead className="w-[70px] text-center">Fédé</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableFilter className="sticky top-8 z-10 bg-muted/50">
              <TableFilterRow>
                <TableFilterCell className="hidden sm:table-cell" />
                <TableFilterCell className="w-[44px]" />
                <TableFilterCell />
                {(['riderNumber'] as const).map(col => (
                  <FilterCell key={col} column={col} value={filters[col]} onChange={handleFilterChange} />
                ))}
                {avecChrono && <TableFilterCell />}
                {avecChrono && <TableFilterCell />}
                {(['name', 'club'] as const).map(col => (
                  <FilterCell key={col} column={col} value={filters[col]} onChange={handleFilterChange} />
                ))}
                <TableFilterCell className="hidden sm:table-cell" />
                <TableFilterCell className="hidden sm:table-cell" />
                <TableFilterCell className="hidden sm:table-cell" />
                <TableFilterCell className="hidden sm:table-cell" />
                <TableFilterCell />
                <TableFilterCell />
                <TableFilterCell />
              </TableFilterRow>
            </TableFilter>
            <TableBody>
              {filteredRows.map((row, index) => (
                <SortableRow
                  key={row.id ?? `empty-${row.position}`}
                  row={row}
                  avecChrono={avecChrono}
                  onDossardSubmit={handleDossardSubmit}
                  onChronoSubmit={handleChronoSubmit}
                  onToursSubmit={handleToursSubmit}
                  onToggleChallenge={handleToggleChallenge}
                  dnfArmed={dnfMode !== null}
                  selection={selection}
                  rowIndex={index}
                  totalRows={filteredRows.length}
                  inputRefs={inputRefs}
                  isHighlighted={highlightedRowId !== null && row.id === highlightedRowId}
                />
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
      </div>
    </div>
  );
}
