import { BellRing } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useAccessibleClubs } from '@/hooks/useClubs';

import { CompetitionPushDialog } from './CompetitionPushDialog';

import type { FormValues } from '../types';

interface CompetitionPushSectionProps {
  competitionId: number;
}

/**
 * Encart « Notifier les abonnés » — affiché sous l'encart HelloAsso.
 *
 * Auto-gardé (pattern `HelloAssoOnlinePaymentSection`) : ne rend rien tant que
 * le scope clubs n'est pas chargé, ni si l'utilisateur n'a pas le club
 * organisateur dans son scope. Un ADMIN (scope ALL) voit l'encart même sur une
 * épreuve sans club — même règle que `assertCompetitionAccess` côté backend,
 * qui re-vérifie de toute façon en 403. Le bouton ouvre la modale d'envoi en
 * 2 étapes (`CompetitionPushDialog`).
 */
export function CompetitionPushSection({ competitionId }: CompetitionPushSectionProps) {
  const form = useFormContext<FormValues>();
  const competitionName = form.watch('name');
  const watchedClubId = form.watch('clubId');
  const accessibleClubs = useAccessibleClubs();
  const [dialogOpen, setDialogOpen] = useState(false);

  const scope = accessibleClubs.data;
  if (scope == null || (scope.scope !== 'ALL' && !accessibleClubs.canEditClub(watchedClubId))) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg border-2 border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-orange-500/30">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-base font-semibold m-0">Notifications push</p>
            <p className="text-sm text-muted-foreground">
              Envoyez un message aux utilisateurs qui suivent cette épreuve sur l&apos;app Dossardeur.
            </p>
          </div>
        </div>
        {/* type="button" obligatoire : l'encart vit dans le <form> de l'épreuve */}
        <Button type="button" variant="notify" onClick={() => setDialogOpen(true)}>
          <BellRing className="h-4 w-4" />
          Notifier les abonnés de cette épreuve
        </Button>
      </div>

      <CompetitionPushDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        competitionId={competitionId}
        competitionName={competitionName || 'Épreuve'}
      />
    </>
  );
}
