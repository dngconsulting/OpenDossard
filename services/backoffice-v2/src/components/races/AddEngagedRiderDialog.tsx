import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StringField } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { useLicences } from '@/hooks/useLicences';
import type { LicenceType } from '@/types/licences';
import type { EngagedRider } from '@/types/races';

const formSchema = z.object({
  bibNumber: z.string().min(1, 'Le numéro de dossard est requis'),
  licenceSearch: z.string().min(1, 'Veuillez sélectionner une licence'),
});

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (rider: Omit<EngagedRider, 'id'>) => void;
};

export const AddEngagedRiderDialog = ({ open, onClose, onAdd }: Props) => {
  const [selectedLicence, setSelectedLicence] = useState<LicenceType | null>(null);
  const { data: licences } = useLicences();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bibNumber: '',
      licenceSearch: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedLicence) {
      return;
    }

    const rider: Omit<EngagedRider, 'id'> = {
      licenceId: selectedLicence.id,
      bibNumber: values.bibNumber,
      name: `${selectedLicence.lastName} ${selectedLicence.firstName}`,
      club: selectedLicence.club,
      gender: selectedLicence.gender,
      dept: selectedLicence.state,
      category: selectedLicence.category,
    };

    onAdd(rider);
    form.reset();
    setSelectedLicence(null);
    onClose();
  };

  const handleLicenceSelect = (licenceId: string) => {
    const licence = licences?.find(l => l.id === licenceId);
    if (licence) {
      setSelectedLicence(licence);
      form.setValue('licenceSearch', `${licence.lastName} ${licence.firstName} - ${licence.club}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un engagé</DialogTitle>
          <DialogDescription>
            Recherchez une licence et assignez un numéro de dossard
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="licence-select" className="text-sm font-medium">Rechercher une licence</label>
              <select
                id="licence-select"
                className="w-full rounded-md border p-2"
                onChange={(e) => handleLicenceSelect(e.target.value)}
                value={selectedLicence?.id || ''}
              >
                <option value="">Sélectionner une licence...</option>
                {licences?.map((licence) => (
                  <option key={licence.id} value={licence.id}>
                    {licence.lastName} {licence.firstName} - {licence.club} ({licence.licenceNumber})
                  </option>
                ))}
              </select>
            </div>

            {selectedLicence && (
              <div className="rounded-md border p-4 space-y-2 bg-muted/50">
                <p className="text-sm"><strong>Nom:</strong> {selectedLicence.lastName} {selectedLicence.firstName}</p>
                <p className="text-sm"><strong>Club:</strong> {selectedLicence.club}</p>
                <p className="text-sm"><strong>Sexe:</strong> {selectedLicence.gender}</p>
                <p className="text-sm"><strong>Département:</strong> {selectedLicence.state}</p>
                <p className="text-sm"><strong>Catégorie:</strong> {selectedLicence.category}</p>
              </div>
            )}

            <StringField
              form={form}
              label="Numéro de dossard"
              field="bibNumber"
              placeholder="101"
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={!selectedLicence}>
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
