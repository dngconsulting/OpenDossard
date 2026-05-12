import { Loader2, Unlink } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useHelloAssoUnlink } from '@/hooks/useHelloAssoAuth';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

type Props = {
  clubId: number;
  slug?: string;
};

export function HelloAssoUnlinkButton({ clubId, slug }: Props) {
  const [open, setOpen] = useState(false);
  const mutation = useHelloAssoUnlink(clubId);

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync();
      showSuccessToast('Liaison HelloAsso supprimée');
      setOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      showErrorToast('Échec de la suppression de la liaison', msg);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
        Délier
      </Button>
      <Dialog open={open} onOpenChange={next => !mutation.isPending && setOpen(next)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Délier HelloAsso ?</DialogTitle>
            <DialogDescription>
              Délier ce club de HelloAsso
              {slug ? (
                <>
                  {' '}(<strong>{slug}</strong>)
                </>
              ) : null}
              {' ?'} Le club redeviendra modifiable. Les tokens HelloAsso resteront valides
              côté HelloAsso jusqu&apos;à leur expiration normale. Action réversible via la mire.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Délier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
