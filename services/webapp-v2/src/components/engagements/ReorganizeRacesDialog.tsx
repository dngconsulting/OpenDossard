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
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReorganizeRaces } from '@/hooks/useCompetitions';
import type { RaceRowType } from '@/types/races';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: number;
  currentRaces: string[]; // Les départs actuels
  engagements: RaceRowType[]; // Les engagements pour compter par catégorie
  onSuccess?: () => void;
};

type CategoryStats = {
  catev: string;
  count: number;
};

/**
 * Calcule les statistiques par catégorie
 */
function computeByCate(engagements: RaceRowType[]): CategoryStats[] {
  const catemap = engagements.reduce<Record<string, number>>((acc, row) => {
    return {
      ...acc,
      [row.catev]: (acc[row.catev] || 0) + 1,
    };
  }, {});

  return Object.keys(catemap)
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
    .map(catev => ({
      catev,
      count: catemap[catev],
    }));
}

/**
 * Vérifie les erreurs de configuration des départs
 */
function computeErrors(races: string[], categoriesWithEngaged: string[]): string[] {
  const errors: string[] = [];

  // Filtrer les races vides
  const nonEmptyRaces = races.filter(race => race.trim().length > 0);

  // Vérifier le format (doit commencer par alphanumérique)
  const invalidFormat = nonEmptyRaces
    .filter(race => !/^[a-zA-Z0-9]/.test(race))
    .map(input => `Saisie incorrecte "${input}"`);

  if (invalidFormat.length > 0) {
    return invalidFormat;
  }

  // Extraire toutes les catégories des départs
  const flatCategories = nonEmptyRaces
    .flatMap(race => race.split('/'))
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const uniqueCategories = Array.from(new Set(flatCategories));

  // Vérifier que toutes les catégories avec engagés sont présentes
  const missingCategories = categoriesWithEngaged.filter(c => !uniqueCategories.includes(c));

  if (missingCategories.length > 0) {
    errors.push(
      `Les coureurs engagés en catégories ${missingCategories.join(', ')} n'existent pas dans votre nouvelle organisation`,
    );
  }

  // Vérifier les doublons
  if (flatCategories.length !== uniqueCategories.length) {
    errors.push('Certaines catégories sont renseignées en double');
  }

  return errors;
}

type RaceItem = {
  id: string;
  value: string;
};

function SortableRaceRow({
  item,
  index,
  totalItems,
  onChange,
  onRemove,
  onAdd,
}: {
  item: RaceItem;
  index: number;
  totalItems: number;
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
      <Input
        value={item.value}
        onChange={e => onChange(item.id, e.target.value)}
        placeholder="Ex: 1/2/3/C"
        className="flex-1 min-w-[400px]"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        disabled={totalItems <= 1}
        className="text-destructive hover:text-destructive"
        title="Supprimer ce départ"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {index === totalItems - 1 ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onAdd}
          className="text-primary hover:text-primary"
          title="Ajouter un départ"
        >
          <Plus className="h-4 w-4" />
        </Button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  );
}

let nextId = 0;
function createItem(value: string): RaceItem {
  return { id: `race-${++nextId}`, value };
}

export function ReorganizeRacesDialog({
  open,
  onOpenChange,
  competitionId,
  currentRaces,
  engagements,
  onSuccess,
}: Props) {
  const [items, setItems] = useState<RaceItem[]>([]);
  const reorganizeMutation = useReorganizeRaces();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Initialiser les races à l'ouverture
  useEffect(() => {
    if (open) {
      setItems(
        currentRaces.length > 0
          ? currentRaces.map(r => createItem(r))
          : [createItem('')],
      );
    }
  }, [open, currentRaces]);

  // Valeurs string pour la validation
  const races = useMemo(() => items.map(i => i.value), [items]);

  // Statistiques par catégorie
  const categoryStats = useMemo(() => computeByCate(engagements), [engagements]);

  // Catégories avec des engagés
  const categoriesWithEngaged = useMemo(() => categoryStats.map(s => s.catev), [categoryStats]);

  // Erreurs de validation
  const errors = useMemo(
    () => computeErrors(races, categoriesWithEngaged),
    [races, categoriesWithEngaged],
  );

  const handleChange = (id: string, value: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, value: value.replace(/\s/g, '') } : item,
      ),
    );
  };

  const handleAdd = () => {
    setItems(prev => [...prev, createItem('')]);
  };

  const handleRemove = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems(prev => {
      const oldIndex = prev.findIndex(i => i.id === active.id);
      const newIndex = prev.findIndex(i => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = async () => {
    try {
      // Filtrer les races vides avant d'envoyer
      const cleanRaces = races.filter(r => r.trim().length > 0);
      await reorganizeMutation.mutateAsync({
        competitionId,
        races: cleanRaces,
      });
      showSuccessToast('Les départs ont été réorganisés avec succès');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      showErrorToast(
        'Erreur lors de la réorganisation',
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Réorganiser les départs</DialogTitle>
          <DialogDescription>
            Modifiez l'organisation des catégories par départ. Le caractère <strong>"/"</strong>{' '}
            permet de grouper plusieurs catégories dans un même départ (ex: 1/2 signifie que les
            catégories 1 et 2 courent ensemble).
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 py-4">
          {/* Liste des départs */}
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Départs (ordre d'affichage)
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item, index) => (
                  <SortableRaceRow
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={items.length}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    onAdd={handleAdd}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Tableau des catégories */}
          {categoryStats.length > 0 && (
            <div className="w-64">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Répartition par catégorie
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8">Catégorie</TableHead>
                    <TableHead className="h-8 text-right">Engagés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.map(stat => (
                    <TableRow key={stat.catev}>
                      <TableCell className="py-1 font-medium">{stat.catev}</TableCell>
                      <TableCell className="py-1 text-right">{stat.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Erreurs */}
        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {errors.map((error, i) => (
              <p key={i} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={errors.length > 0 || reorganizeMutation.isPending}>
            {reorganizeMutation.isPending ? 'Enregistrement...' : 'Réorganiser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
