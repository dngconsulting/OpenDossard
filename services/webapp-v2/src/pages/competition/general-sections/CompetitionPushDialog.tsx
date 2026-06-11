import { BellRing, ChevronLeft, Loader2, Send, Users } from 'lucide-react';
import { useEffect, useState } from 'react';


import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePushTargets, useSendCompetitionPush } from '@/hooks/useCompetitionPush';
import { pluralize } from '@/lib/pluralize';
import { cn } from '@/lib/utils';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

const MESSAGE_MAX_LENGTH = 500;

interface CompetitionPushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: number;
  competitionName: string;
}

/**
 * Modale d'envoi de push aux abonnés d'une épreuve, en 2 étapes :
 *
 * 1. `compose` — saisie du message avec aperçu LIVE de la notification telle
 *    qu'elle apparaîtra sur le téléphone (titre = nom de l'épreuve, imposé
 *    par le backend). « Valider » passe à la confirmation.
 * 2. `confirm` — « Vous allez notifier X utilisateurs » (X fetché à l'entrée
 *    de l'étape via GET /competitions/:id/push/targets, jamais mis en cache).
 *    « Annuler » revient à l'étape 1 sans perdre le message.
 *
 * En cas d'erreur d'envoi, le handler global affiche déjà un toast — la
 * modale reste ouverte sur l'étape de confirmation.
 */
export function CompetitionPushDialog({
  open,
  onOpenChange,
  competitionId,
  competitionName,
}: CompetitionPushDialogProps) {
  const [step, setStep] = useState<'compose' | 'confirm'>('compose');
  const [message, setMessage] = useState('');

  const targets = usePushTargets(competitionId, open && step === 'confirm');
  const sendPush = useSendCompetitionPush();

  // Réouverture = repartir d'une modale vierge.
  useEffect(() => {
    if (open) {
      setStep('compose');
      setMessage('');
    }
  }, [open]);

  const trimmed = message.trim();
  const targetedUsers = targets.data?.targetedUsers;

  const handleConfirm = () => {
    sendPush.mutate(
      { competitionId, message: trimmed },
      {
        onSuccess: result => {
          showSuccessToast(
            `Notification envoyée à ${pluralize(result.targetedUsers, 'utilisateur')}`,
            pluralize(result.sentDevices, 'appareil notifié', 'appareils notifiés'),
          );
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'compose' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                  <BellRing className="h-4 w-4 text-white" />
                </span>
                Notifier les abonnés
              </DialogTitle>
              <DialogDescription>
                Votre message sera envoyé sur le téléphone de chaque coureur qui suit «{' '}
                {competitionName} ».
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Aperçu live, façon notification iOS/Android */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Aperçu sur le téléphone
                </p>
                <div className="rounded-2xl border bg-zinc-50 dark:bg-zinc-800/80 shadow-sm p-3.5 flex gap-3 overflow-hidden">
                  {/* Icône de l'app Dossardeur, telle qu'affichée dans une vraie notification */}
                  <img
                    src="/dossardeur-app-icon.png"
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-xl shadow-sm"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      {/* min-w-0 indispensable : truncate (nowrap) sans lui impose sa
                          largeur min-content à toute la modale → débordement. */}
                      <p className="text-sm font-semibold truncate m-0 min-w-0 flex-1">
                        {competitionName}
                      </p>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        maintenant
                      </span>
                    </div>
                    {trimmed ? (
                      <p className="text-sm text-foreground/80 line-clamp-3 break-words m-0">
                        {trimmed}
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground m-0">
                        Votre message apparaîtra ici…
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={MESSAGE_MAX_LENGTH}
                  rows={4}
                  autoFocus
                  placeholder="Ex. : Départ avancé à 9h, retrait des dossards dès 7h30 devant la mairie."
                />
                <p
                  className={cn(
                    'text-xs text-right m-0',
                    message.length > MESSAGE_MAX_LENGTH - 50
                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {message.length}/{MESSAGE_MAX_LENGTH}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="notify"
                disabled={trimmed.length === 0}
                onClick={() => setStep('confirm')}
              >
                Valider
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                  <Send className="h-4 w-4 text-white" />
                </span>
                Confirmer l&apos;envoi
              </DialogTitle>
              <DialogDescription>
                Dernière étape avant l&apos;envoi de la notification.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30">
                {targets.isLoading ? (
                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                ) : (
                  <Users className="h-7 w-7 text-white" />
                )}
              </div>

              {targets.isLoading ? (
                <p className="text-sm text-muted-foreground m-0">Comptage des abonnés…</p>
              ) : targets.isError ? (
                <p className="text-sm text-destructive m-0">
                  Impossible de compter les abonnés. Réessayez plus tard.
                </p>
              ) : targetedUsers === 0 ? (
                <div className="space-y-1">
                  <p className="text-lg font-semibold m-0">Aucun abonné</p>
                  <p className="text-sm text-muted-foreground m-0">
                    Personne ne suit cette épreuve pour le moment — il n&apos;y a personne à
                    notifier.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-4xl font-bold tabular-nums m-0">{targetedUsers}</p>
                  <p className="text-base m-0">
                    Vous allez notifier{' '}
                    <span className="font-semibold">
                      {pluralize(targetedUsers ?? 0, 'utilisateur')}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground m-0">
                    L&apos;envoi est immédiat et ne peut pas être annulé.
                  </p>
                </div>
              )}

              {/* Rappel du message qui partira */}
              <div className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-left">
                <p className="text-xs text-muted-foreground mb-0.5 mt-0">{competitionName}</p>
                <p className="text-sm line-clamp-2 break-words m-0">{trimmed}</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('compose')}
                disabled={sendPush.isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                Annuler
              </Button>
              <Button
                type="button"
                variant="notify"
                onClick={handleConfirm}
                disabled={sendPush.isPending || targets.isLoading || !targetedUsers}
              >
                {sendPush.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Confirmer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
