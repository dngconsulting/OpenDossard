import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Trash2 } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteRace } from '@/hooks/useRaces';
import { cn } from '@/lib/utils';
import type { RaceRowType } from '@/types/races';

type SortColumn = 'riderNumber' | 'name' | 'club' | 'gender' | 'dept' | 'birthYear' | 'catea' | 'catev' | 'fede';
type SortDirection = 'asc' | 'desc';

type EngagementsTableProps = {
  engagements: RaceRowType[];
  currentRaceCode: string;
  competitionId: number;
  isLoading?: boolean;
};

/**
 * Vérifie si un coureur est surclassé (sa catégorie n'est pas dans le raceCode)
 */
function isSurclassed(catev: string | undefined, raceCode: string): boolean {
  if (!catev) {
    return false;
  }
  const categories = raceCode.split('/');
  return !categories.includes(catev);
}

type SortableHeaderProps = {
  column: SortColumn;
  currentColumn: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
  children: React.ReactNode;
  className?: string;
};

function SortableHeader({ column, currentColumn, direction, onSort, children, className }: SortableHeaderProps) {
  const isActive = column === currentColumn;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="flex items-center gap-1 hover:text-foreground transition-colors w-full"
        onClick={() => onSort(column)}
      >
        {children}
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    </TableHead>
  );
}

export function EngagementsTable({
  engagements,
  currentRaceCode,
  competitionId,
  isLoading = false,
}: EngagementsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<RaceRowType | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('riderNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const deleteMutation = useDeleteRace();

  // Toggle sort on column click
  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // Filtrer et trier par course courante
  const filteredEngagements = useMemo(() => {
    const filtered = engagements.filter(e => e.raceCode === currentRaceCode);

    return filtered.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare based on type
      let comparison: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'fr', { numeric: true, sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [engagements, currentRaceCode, sortColumn, sortDirection]);

  // Vérifier si on peut supprimer (pas classé et pas de commentaire type ABD/DNF)
  const canDelete = useCallback((engagement: RaceRowType) => {
    return !engagement.rankingScratch && !engagement.comment;
  }, []);

  // Vérifier si au moins un engagement peut être supprimé
  const hasAnyDeletable = useMemo(() => {
    return filteredEngagements.some(e => canDelete(e));
  }, [filteredEngagements, canDelete]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({
        id: deleteTarget.id,
        competitionId,
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Chargement des engagements...
      </div>
    );
  }

  if (filteredEngagements.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground border rounded-lg">
        Aucun coureur engagé sur cette course
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {hasAnyDeletable && <TableHead className="w-[60px]">Actions</TableHead>}
              <SortableHeader column="riderNumber" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[70px]">
                Dossard
              </SortableHeader>
              <SortableHeader column="name" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[20%] min-w-[150px]">
                Coureur
              </SortableHeader>
              <SortableHeader column="club" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[20%] min-w-[150px]">
                Club
              </SortableHeader>
              <SortableHeader column="gender" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[50px]">
                H/F
              </SortableHeader>
              <SortableHeader column="dept" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[50px]">
                Dept
              </SortableHeader>
              <SortableHeader column="birthYear" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[60px]">
                Année
              </SortableHeader>
              <SortableHeader column="catea" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[70px]">
                Caté. A.
              </SortableHeader>
              <SortableHeader column="catev" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[70px]">
                Caté. V.
              </SortableHeader>
              <SortableHeader column="fede" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-[70px]">
                Fédé.
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEngagements.map(engagement => {
              const surclassed = isSurclassed(engagement.catev, currentRaceCode);
              return (
                <TableRow
                  key={engagement.id}
                  className={cn(surclassed && 'bg-amber-50 dark:bg-amber-950/30')}
                >
                  {/* Actions */}
                  {hasAnyDeletable && (
                    <TableCell>
                      <div className="flex gap-1">
                        {canDelete(engagement) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(engagement)}
                            title="Désengager"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* Dossard - lien vers palmarès */}
                  <TableCell>
                    <Link
                      to={`/palmares/${engagement.licenceId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {engagement.riderNumber}
                    </Link>
                  </TableCell>

                  {/* Coureur - lien vers fiche licence */}
                  <TableCell className="max-w-[200px]" title={engagement.name || undefined}>
                    <Link
                      to={`/licence/${engagement.licenceId}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      <span className="truncate">{engagement.name}</span>
                      <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                    </Link>
                  </TableCell>

                  {/* Club */}
                  <TableCell className="text-muted-foreground max-w-[200px] truncate" title={engagement.club || undefined}>{engagement.club || '-'}</TableCell>

                  {/* Genre */}
                  <TableCell>
                    <Badge variant={engagement.gender === 'F' ? 'secondary' : 'outline'}>
                      {engagement.gender || '-'}
                    </Badge>
                  </TableCell>

                  {/* Département */}
                  <TableCell>{engagement.dept || '-'}</TableCell>

                  {/* Année de naissance */}
                  <TableCell>{engagement.birthYear || '-'}</TableCell>

                  {/* Catégorie âge */}
                  <TableCell>{engagement.catea || '-'}</TableCell>

                  {/* Catégorie valeur + indicateur surclassement */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {engagement.catev || '-'}
                      {surclassed && (
                        <span title="Coureur surclassé">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Fédération */}
                  <TableCell>
                    <Badge variant="outline">{engagement.fede || '-'}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Désengager le coureur"
        description={`Êtes-vous sûr de vouloir désengager ${deleteTarget?.name} (dossard ${deleteTarget?.riderNumber}) ?`}
        confirmLabel="Désengager"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </>
  );
}
