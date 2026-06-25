import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type BulkDeleteToolbarButtonProps = {
  /** Nombre de lignes sélectionnées. */
  count: number;
  /** Libellé de l'action : « Désengager », « Déclasser ». */
  actionLabel: string;
  /** Nom de l'entité au singulier pour le message : « coureur ». */
  entityLabel?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
};

/**
 * Bouton poubelle affiché dans la toolbar dès qu'au moins une ligne est
 * sélectionnée. Style aligné sur les autres boutons de la toolbar
 * (`variant="outline"`), teinté destructif. Embarque la confirmation.
 */
export function BulkDeleteToolbarButton({
  count,
  actionLabel,
  entityLabel = 'coureur',
  onConfirm,
  isPending = false,
}: BulkDeleteToolbarButtonProps) {
  const [open, setOpen] = useState(false);
  const plural = count > 1 ? 's' : '';

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        title={`${actionLabel} la sélection`}
      >
        <Trash2 className="h-4 w-4" />
        {actionLabel} ({count})
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${actionLabel} ${count} ${entityLabel}${plural}`}
        description={`Êtes-vous sûr de vouloir ${actionLabel.toLowerCase()} ${count} ${entityLabel}${plural} sélectionné${plural} ?`}
        confirmLabel={actionLabel}
        onConfirm={handleConfirm}
        isLoading={isPending}
        variant="destructive"
      />
    </>
  );
}
