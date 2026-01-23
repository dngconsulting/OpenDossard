import { AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

export function EngagementsTable({
  engagements,
  currentRaceCode,
  competitionId,
  isLoading = false,
}: EngagementsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<RaceRowType | null>(null);
  const deleteMutation = useDeleteRace();

  // Filtrer par course courante
  const filteredEngagements = useMemo(() => {
    return engagements
      .filter(e => e.raceCode === currentRaceCode)
      .sort((a, b) => (a.riderNumber || 0) - (b.riderNumber || 0));
  }, [engagements, currentRaceCode]);

  // Vérifier si on peut supprimer (pas classé et pas de commentaire type ABD/DNF)
  const canDelete = (engagement: RaceRowType) => {
    return !engagement.rankingScratch && !engagement.comment;
  };

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
              <TableHead className="w-[60px]">Actions</TableHead>
              <TableHead className="w-[70px]">Dossard</TableHead>
              <TableHead className="w-[20%] min-w-[150px]">Coureur</TableHead>
              <TableHead className="w-[20%] min-w-[150px]">Club</TableHead>
              <TableHead className="w-[50px]">H/F</TableHead>
              <TableHead className="w-[50px]">Dept</TableHead>
              <TableHead className="w-[60px]">Année</TableHead>
              <TableHead className="w-[70px]">Caté. A.</TableHead>
              <TableHead className="w-[70px]">Caté. V.</TableHead>
              <TableHead className="w-[70px]">Fédé.</TableHead>
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
                  <TableCell>
                    <Link
                      to={`/licence/${engagement.licenceId}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {engagement.name}
                      <ExternalLink className="h-3 w-3 opacity-50" />
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
