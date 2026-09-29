import { Lock, LockOpen } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCloseChallenge, useReopenChallenge } from '@/hooks/useChallenges';
import useUserStore from '@/store/UserStore';
import type { ChallengeType } from '@/types/challenges';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

type Props = { challenge: ChallengeType };

/** Terminer (fige le classement) ou ré-ouvrir un challenge. Réservé aux admins. */
export function ChallengeLifecycleButton({ challenge }: Props) {
  const isAdmin = useUserStore(state => state.user?.roles?.includes('ADMIN'));
  const [open, setOpen] = useState(false);
  const closeChallenge = useCloseChallenge();
  const reopenChallenge = useReopenChallenge();

  if (!isAdmin) {
    return null;
  }

  const isClosed = !!challenge.closedAt;
  const mutation = isClosed ? reopenChallenge : closeChallenge;

  const handleConfirm = () =>
    mutation.mutate(challenge.id, {
      onSuccess: () => showSuccessToast(isClosed ? 'Challenge ré-ouvert' : 'Challenge terminé'),
    });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={mutation.isPending}>
        {isClosed ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
        {isClosed ? 'Ré-ouvrir' : 'Terminer'}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        variant="warning"
        title={isClosed ? 'Ré-ouvrir le challenge ?' : 'Terminer le challenge ?'}
        description={
          isClosed
            ? "L'archive sera supprimée et le classement redeviendra calculé en direct."
            : 'Le classement actuel sera figé et archivé (20 premiers par catégorie). Les changements de catégorie ultérieurs n’auront plus d’effet.'
        }
        confirmLabel={isClosed ? 'Ré-ouvrir' : 'Terminer'}
        onConfirm={handleConfirm}
        isLoading={mutation.isPending}
      />
    </>
  );
}
