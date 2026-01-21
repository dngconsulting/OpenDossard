import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useClubsByFedeAndDept, useCreateClub } from '@/hooks/useClubs';
import { cn } from '@/lib/utils';

type ClubAutocompleteProps = {
  value: number | null;
  onChange: (clubId: number | null, clubName: string) => void;
  fede: string | undefined | null;
  department: string | undefined | null;
  disabled?: boolean;
  error?: string;
  description?: string;
  required?: boolean;
};

export function ClubAutocomplete({
  value,
  onChange,
  fede,
  department,
  disabled = false,
  error,
  description,
  required,
}: ClubAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // V1 style: fetch ALL clubs for fede+dept when both are available
  const { data: clubs, isLoading } = useClubsByFedeAndDept(fede ?? '', department ?? '');
  const createClub = useCreateClub();

  // Disable if no fede or department
  const isDisabled = disabled || !fede || !department;

  // Filter clubs locally based on search input
  const filteredClubs = useMemo(() => {
    if (!clubs) return [];
    if (!search.trim()) return clubs;
    const lowerSearch = search.trim().toLowerCase();
    return clubs.filter(club => club.longName.toLowerCase().includes(lowerSearch));
  }, [clubs, search]);

  // Trimmed search value for comparisons
  const trimmedSearch = search.trim();
  const lowerSearch = trimmedSearch.toLowerCase();

  // Check if exact match exists (trimmed, case-insensitive)
  const exactMatchExists = useMemo(() => {
    if (!trimmedSearch || !clubs) return false;
    return clubs.some(club => club.longName.trim().toLowerCase() === lowerSearch);
  }, [clubs, trimmedSearch, lowerSearch]);

  // Should show the create button?
  // Only if: there's a non-empty trimmed search, no exact match exists, and fede+dept are selected
  const showCreateButton = trimmedSearch && !exactMatchExists && fede && department && !isLoading;

  // Find the selected club by ID
  const selectedClub = useMemo(() => {
    if (!value || !clubs) return null;
    return clubs.find(club => club.id === value) ?? null;
  }, [value, clubs]);

  const handleSelect = (clubId: number, clubName: string) => {
    onChange(clubId, clubName);
    setSearch('');
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!trimmedSearch || !fede || !department) return;

    try {
      const newClub = await createClub.mutateAsync({
        longName: trimmedSearch,
        shortName: null,
        dept: department,
        fede,
        elicenceName: null,
      });
      handleSelect(newClub.id, newClub.longName);
    } catch (err) {
      console.error('Failed to create club:', err);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isDisabled) return;
    setOpen(isOpen);
    if (!isOpen) {
      setSearch('');
    }
  };

  const isInvalid = !!error;

  return (
    <div className="space-y-2">
      <Label>
        Club organisateur
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={isDisabled}
          >
            <span className={cn(!selectedClub && 'text-muted-foreground')}>
              {selectedClub?.longName || (isDisabled ? 'Sélectionnez une fédération et un département' : 'Rechercher un club...')}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] overflow-hidden p-0"
          align="start"
        >
          <div className="p-2">
            <Input
              placeholder="Rechercher un club..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <div
            className="max-h-60 overflow-y-auto overscroll-contain"
            onWheel={e => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement des clubs...
              </div>
            ) : (
              <div className="p-1">
                {filteredClubs.length > 0 ? (
                  filteredClubs.map(club => (
                    <button
                      key={club.id}
                      type="button"
                      className={cn(
                        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                        value === club.id && 'bg-accent'
                      )}
                      onClick={() => handleSelect(club.id, club.longName)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === club.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 text-left">{club.longName}</span>
                    </button>
                  ))
                ) : search.trim() ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    Aucun club trouvé pour "{trimmedSearch}"
                  </div>
                ) : (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    Aucun club disponible
                  </div>
                )}

                {/* Create button - only if no exact match exists */}
                {showCreateButton && (
                  <button
                    type="button"
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary border-t mt-1 pt-2"
                    onClick={handleCreate}
                    disabled={createClub.isPending}
                  >
                    {createClub.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Créer le club "{trimmedSearch}"
                  </button>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {isInvalid && <p className="text-destructive text-sm">{error}</p>}
      {description && !isInvalid && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
  );
}
