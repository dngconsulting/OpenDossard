import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { LinkedClubsList } from '@/components/forms/user-clubs/LinkedClubsList';
import { UserClubsSearchPanel } from '@/components/forms/user-clubs/UserClubsSearchPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDepartments } from '@/hooks/useDepartments';
import { useSetUserClubs, useUserClubs } from '@/hooks/useUsers';
import { pluralize } from '@/lib/pluralize';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

type UserClubsSectionProps = {
  userId: number;
};

/**
 * Section "Clubs gérés" du formulaire user (admin only, mode édition).
 *
 * Orchestrateur : détient la query `useUserClubs`, la mutation `useSetUserClubs`,
 * et le mapping département → nom partagé entre les deux blocs. La logique d'UI
 * est portée par les sous-composants :
 * - `UserClubsSearchPanel` : recherche + ajout (filtres fédé/dept, résultats groupés).
 * - `LinkedClubsList` : badges des clubs déjà liés (groupés par dept, retrait).
 *
 * Visibilité contrôlée par le parent : afficher uniquement si le rôle du user
 * contient ORGANISATEUR.
 */
export function UserClubsSection({ userId }: UserClubsSectionProps) {
  const userClubsQuery = useUserClubs(userId);
  const departmentsQuery = useDepartments();
  const setUserClubsMutation = useSetUserClubs();

  const [confirmRemoveAllOpen, setConfirmRemoveAllOpen] = useState(false);

  const linkedClubs = useMemo(() => userClubsQuery.data ?? [], [userClubsQuery.data]);
  const linkedIdsSet = useMemo(() => new Set(linkedClubs.map(c => c.id)), [linkedClubs]);

  const deptNameByCode = useMemo(
    () => new Map((departmentsQuery.data ?? []).map(d => [d.code, d.name])),
    [departmentsQuery.data],
  );

  const isPending = setUserClubsMutation.isPending;

  const applyClubIds = async (nextIds: number[], successMsg: string) => {
    try {
      await setUserClubsMutation.mutateAsync({ userId, clubIds: nextIds });
      showSuccessToast(successMsg);
    } catch {
      showErrorToast('Impossible de mettre à jour les clubs liés');
    }
  };

  const handleAdd = async (clubIds: number[]) => {
    const nextIds = [...new Set([...linkedClubs.map(c => c.id), ...clubIds])];
    await applyClubIds(nextIds, `${pluralize(clubIds.length, 'club ajouté', 'clubs ajoutés')}`);
  };

  const handleRemove = async (clubId: number) => {
    const nextIds = linkedClubs.filter(c => c.id !== clubId).map(c => c.id);
    await applyClubIds(nextIds, 'Club retiré');
  };

  const handleRemoveAll = async () => {
    const count = linkedClubs.length;
    await applyClubIds([], `${pluralize(count, 'club retiré', 'clubs retirés')}`);
    setConfirmRemoveAllOpen(false);
  };

  return (
    <Card className="bg-slate-100 dark:bg-muted/50 border-slate-200 dark:border-muted">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          Clubs gérés
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({linkedClubs.length})
          </span>
          {linkedClubs.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmRemoveAllOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Tout supprimer
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UserClubsSearchPanel
          linkedIdsSet={linkedIdsSet}
          deptNameByCode={deptNameByCode}
          departments={departmentsQuery.data ?? []}
          isPending={isPending}
          onAdd={handleAdd}
        />

        <div className="border-t" />

        <LinkedClubsList
          linkedClubs={linkedClubs}
          deptNameByCode={deptNameByCode}
          isLoading={userClubsQuery.isLoading}
          isPending={isPending}
          onRemove={handleRemove}
        />
      </CardContent>

      <ConfirmDialog
        open={confirmRemoveAllOpen}
        onOpenChange={setConfirmRemoveAllOpen}
        title="Délier tous les clubs ?"
        description={`Cet organisateur va perdre l'accès aux ${pluralize(linkedClubs.length, 'club actuellement lié', 'clubs actuellement liés')}. Tu pourras les ré-ajouter ensuite via la recherche.`}
        confirmLabel="Tout supprimer"
        variant="destructive"
        onConfirm={() => void handleRemoveAll()}
        isLoading={isPending}
      />
    </Card>
  );
}
