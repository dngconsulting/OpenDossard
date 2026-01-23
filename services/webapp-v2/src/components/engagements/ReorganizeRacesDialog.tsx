import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
 * Compte le nombre d'engagés pour un ensemble de catégories (un départ)
 */
function computeByRace(engagements: RaceRowType[], categories: string[]): number {
  return engagements.filter(e => categories.includes(e.catev)).length;
}

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
  const missingCategories = categoriesWithEngaged.filter(
    c => !uniqueCategories.includes(c)
  );

  if (missingCategories.length > 0) {
    errors.push(
      `Les coureurs engagés en catégories ${missingCategories.join(', ')} n'existent pas dans votre nouvelle organisation`
    );
  }

  // Vérifier les doublons
  if (flatCategories.length !== uniqueCategories.length) {
    errors.push('Certaines catégories sont renseignées en double');
  }

  return errors;
}

export function ReorganizeRacesDialog({
  open,
  onOpenChange,
  competitionId,
  currentRaces,
  engagements,
  onSuccess,
}: Props) {
  const [races, setRaces] = useState<string[]>([]);
  const reorganizeMutation = useReorganizeRaces();

  // Initialiser les races à l'ouverture
  useEffect(() => {
    if (open) {
      setRaces(currentRaces.length > 0 ? [...currentRaces] : ['']);
    }
  }, [open, currentRaces]);

  // Statistiques par catégorie
  const categoryStats = useMemo(() => computeByCate(engagements), [engagements]);

  // Catégories avec des engagés
  const categoriesWithEngaged = useMemo(
    () => categoryStats.map(s => s.catev),
    [categoryStats]
  );

  // Erreurs de validation
  const errors = useMemo(
    () => computeErrors(races, categoriesWithEngaged),
    [races, categoriesWithEngaged]
  );

  const handleRaceChange = (index: number, value: string) => {
    const newRaces = [...races];
    // Supprimer les espaces
    newRaces[index] = value.replace(/\s/g, '');
    setRaces(newRaces);
  };

  const handleAddRace = () => {
    setRaces([...races, '']);
  };

  const handleRemoveRace = (index: number) => {
    if (races.length > 1) {
      setRaces(races.filter((_, i) => i !== index));
    }
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
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Réorganiser les départs</DialogTitle>
          <DialogDescription>
            Modifiez l'organisation des catégories par départ. Le caractère{' '}
            <strong>"/"</strong> permet de grouper plusieurs catégories dans un
            même départ (ex: 1/2 signifie que les catégories 1 et 2 courent
            ensemble).
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 py-4">
          {/* Liste des départs */}
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Départs (ordre d'affichage)
            </h3>
            {races.map((race, index) => {
              const engagedCount = computeByRace(
                engagements,
                race.split('/').map(c => c.trim())
              );
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div className="relative flex-1">
                    <Input
                      value={race}
                      onChange={e => handleRaceChange(index, e.target.value)}
                      placeholder="Ex: 1/2 ou 3"
                      className="pr-16"
                    />
                    {engagedCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        {engagedCount} eng.
                      </Badge>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRace(index)}
                        disabled={races.length <= 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer ce départ</TooltipContent>
                  </Tooltip>
                  {index === races.length - 1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleAddRace}
                          className="text-primary hover:text-primary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ajouter un départ</TooltipContent>
                    </Tooltip>
                  )}
                  {index !== races.length - 1 && <div className="w-9" />}
                </div>
              );
            })}
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
                      <TableCell className="py-1 font-medium">
                        {stat.catev}
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        {stat.count}
                      </TableCell>
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
          <Button
            onClick={handleSave}
            disabled={errors.length > 0 || reorganizeMutation.isPending}
          >
            {reorganizeMutation.isPending ? 'Enregistrement...' : 'Réorganiser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
