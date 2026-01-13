import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: licences } = useLicences();
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bibNumber: '',
      licenceSearch: '',
    },
  });

  const filteredLicences = useMemo(() => {
    const licencesList = licences?.data || [];
    if (!licencesList.length || !searchQuery) {
      return licencesList;
    }
    const query = searchQuery.toLowerCase();
    return licencesList.filter((licence: LicenceType) => {
      const fullName = `${licence.name} ${licence.firstName}`.toLowerCase();
      const club = licence.club.toLowerCase();
      const licenceNumber = licence.licenceNumber.toLowerCase();
      return fullName.includes(query) || club.includes(query) || licenceNumber.includes(query);
    });
  }, [licences, searchQuery]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedLicence) {
      return;
    }

    const rider: Omit<EngagedRider, 'id'> = {
      licenceId: String(selectedLicence.id),
      bibNumber: values.bibNumber,
      name: `${selectedLicence.name} ${selectedLicence.firstName}`,
      club: selectedLicence.club,
      gender: selectedLicence.gender as 'H' | 'F',
      dept: selectedLicence.dept,
      category: selectedLicence.catev,
    };

    onAdd(rider);
    form.reset();
    setSelectedLicence(null);
    setSearchQuery('');
    onClose();
  };

  const handleLicenceSelect = (licence: LicenceType) => {
    setSelectedLicence(licence);
    setSearchQuery(`${licence.name} ${licence.firstName} - ${licence.club} (${licence.licenceNumber})`);
    setShowDropdown(false);
    form.setValue('licenceSearch', `${licence.name} ${licence.firstName} - ${licence.club}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              <label htmlFor="licence-search" className="text-sm font-medium">Rechercher une licence</label>
              <div className="relative" ref={autocompleteRef}>
                <Input
                  id="licence-search"
                  type="text"
                  placeholder="Rechercher par nom, club ou numéro de licence..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full"
                />
                {showDropdown && searchQuery && filteredLicences.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                    {filteredLicences.map((licence) => (
                      <button
                        key={licence.id}
                        type="button"
                        onClick={() => handleLicenceSelect(licence)}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                      >
                        <span className="text-sm">
                          <span className="font-medium">{licence.name} {licence.firstName}</span>
                          {' - '}
                          <span className="text-muted-foreground">{licence.club}</span>
                          {' '}
                          <span className="text-xs text-muted-foreground">({licence.licenceNumber})</span>
                        </span>
                        {selectedLicence?.id === licence.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery && filteredLicences.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md p-3">
                    <p className="text-sm text-muted-foreground">Aucune licence trouvée</p>
                  </div>
                )}
              </div>
            </div>

            {selectedLicence && (
              <div className="rounded-md border p-4 space-y-2 bg-muted/50">
                <p className="text-sm"><strong>Nom:</strong> {selectedLicence.name} {selectedLicence.firstName}</p>
                <p className="text-sm"><strong>Club:</strong> {selectedLicence.club}</p>
                <p className="text-sm"><strong>Sexe:</strong> {selectedLicence.gender}</p>
                <p className="text-sm"><strong>Département:</strong> {selectedLicence.dept}</p>
                <p className="text-sm"><strong>Catégorie:</strong> {selectedLicence.catev}</p>
              </div>
            )}

            <StringField
              form={form}
              label="Numéro de dossard"
              field="bibNumber"
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
