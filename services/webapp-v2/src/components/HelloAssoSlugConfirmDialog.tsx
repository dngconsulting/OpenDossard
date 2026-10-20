import { CheckCircle2, Loader2 } from 'lucide-react';

import { HelloAssoRoundLogo } from '@/components/common/HelloAssoRoundLogo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateClub } from '@/hooks/useClubs';
import { useHelloAssoAuth } from '@/hooks/useHelloAssoAuth';

/** Mire aboutie sur une association qui n'est pas (encore) celle du club. */
export type HelloAssoSlugConfirmation = {
  clubId: number;
  /** Association HelloAsso administrée par l'utilisateur (renvoyée par la mire). */
  slug: string;
  /** Association jusqu'ici enregistrée sur le club ; `null` = aucune. */
  clubSlug: string | null;
  /** Club encore lié à son association : il faut le délier avant d'en changer. */
  clubLinked: boolean;
};

type Props = {
  confirmation: HelloAssoSlugConfirmation | null;
  onClose: () => void;
};

/**
 * Dernière étape de la liaison HelloAsso quand la mire a abouti sur une
 * association différente de celle du club (ou que le club n'en avait pas).
 *
 * Ce n'est pas une erreur : l'utilisateur a prouvé être responsable de
 * l'association. On lui fait confirmer qu'elle encaisse pour ce club ; la
 * confirmation enregistre l'association sur la fiche club, puis renvoie sur
 * HelloAsso pour une dernière validation (seconde mire, qui aboutit à la
 * liaison puisque les deux correspondent désormais).
 *
 * Club encore lié à une autre association : pas de confirmation possible (la
 * fiche d'un club lié n'est pas modifiable), on explique qu'il faut délier.
 */
export function HelloAssoSlugConfirmDialog({ confirmation, onClose }: Props) {
  const updateClub = useUpdateClub();
  const authorize = useHelloAssoAuth();
  const isBusy = updateClub.isPending || authorize.isPending;

  const onConfirm = async () => {
    if (!confirmation) {
      return;
    }
    try {
      await updateClub.mutateAsync({
        id: confirmation.clubId,
        updates: { helloAssoSlug: confirmation.slug },
      });
      const { authorizeUrl } = await authorize.mutateAsync(confirmation.clubId);
      window.location.href = authorizeUrl;
    } catch {
      // Erreur affichée par le `MutationCache.onError` global (cf. `App.tsx`).
    }
  };

  return (
    <Dialog open={confirmation !== null} onOpenChange={next => !next && !isBusy && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <HelloAssoRoundLogo size="2rem" />
            <DialogTitle>
              {confirmation?.clubLinked
                ? 'Ce club est déjà lié à HelloAsso'
                : 'Dernière étape : confirmer l’association'}
            </DialogTitle>
          </div>
          {/* L'association fait partie de la description : lue par les lecteurs d'écran. */}
          <DialogDescription asChild>
            <div className="space-y-3">
              <span className="block">
                Vous êtes connecté à HelloAsso en tant que responsable de l’association :
              </span>
              <span className="flex items-center gap-2 rounded-md border border-emerald-600/30 bg-emerald-50 px-4 py-3 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="break-all">{confirmation?.slug}</span>
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {confirmation?.clubLinked ? (
          <>
            <p className="text-sm text-muted-foreground">
              {`Ce club est lié à l’association « ${confirmation.clubSlug ?? ''} ». Pour l’associer à « ${confirmation.slug} », déliez-le d’abord depuis sa fiche, puis relancez la liaison.`}
            </p>
            <DialogFooter>
              <Button onClick={onClose}>Fermer</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 text-sm text-muted-foreground">
              {confirmation?.clubSlug ? (
                <p>{`Ce club était jusqu’ici associé à « ${confirmation.clubSlug} ».`}</p>
              ) : null}
              <p>
                Les inscriptions en ligne des épreuves de ce club seront encaissées sur cette
                association.
              </p>
              <ol className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                    1
                  </span>
                  <span>Connexion à HelloAsso</span>
                  <span className="text-emerald-700 dark:text-emerald-400">— fait</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary text-xs">
                    2
                  </span>
                  <span>Confirmation de l’association</span>
                </li>
              </ol>
              <p>
                En confirmant, HelloAsso vous demandera une dernière validation, puis vous
                reviendrez ici.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isBusy}>
                Annuler
              </Button>
              <Button onClick={onConfirm} disabled={isBusy}>
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirmer
              </Button>
            </DialogFooter>

            <p className="text-xs text-muted-foreground">
              Ce n’est pas la bonne association ? Annulez puis relancez la liaison en vous
              connectant à HelloAsso avec le compte de la bonne association.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
