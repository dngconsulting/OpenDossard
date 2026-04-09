import { AlertTriangle, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LicenceType } from '@/types/licences';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLicence: LicenceType;
  onConfirm: () => void;
  isLoading?: boolean;
};

function Row({ label, value }: { label: string; value: string | number | undefined | null }) {
  const display = value === null || value === undefined || value === '' ? '-' : String(value);
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{display}</span>
    </div>
  );
}

export function DuplicateLicenceDialog({
  open,
  onOpenChange,
  existingLicence,
  onConfirm,
  isLoading = false,
}: Props) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (isLoading) {
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Licence potentiellement en doublon
          </DialogTitle>
          <DialogDescription>
            Les données saisies correspondent à une licence déjà existante. Souhaitez-vous
            réellement poursuivre la création ?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">
              {existingLicence.name} {existingLicence.firstName}
            </h4>
            <a
              href={`/licence/${existingLicence.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Voir la fiche
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Row label="N° de licence" value={existingLicence.licenceNumber} />
          <Row label="Fédération" value={existingLicence.fede} />
          <Row label="Département" value={existingLicence.dept} />
          <Row label="Club" value={existingLicence.club} />
          <Row label="Année de naissance" value={existingLicence.birthYear} />
          <Row label="Genre" value={existingLicence.gender === 'H' ? 'Masculin' : existingLicence.gender === 'F' ? 'Dames' : existingLicence.gender} />
          <Row label="Catégorie d'âge" value={existingLicence.catea} />
          <Row label="Catégorie de valeur" value={existingLicence.catev} />
          {existingLicence.catevCX && <Row label="Catégorie CX" value={existingLicence.catevCX} />}
          <Row label="Saison" value={existingLicence.saison} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} autoFocus>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            Créer quand même
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
