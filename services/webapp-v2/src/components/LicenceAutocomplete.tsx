import { ChevronsUpDown, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSearchLicences } from '@/hooks/useSearchLicences';
import { cn } from '@/lib/utils';
import type { LicenceType } from '@/types/licences';

type LicenceAutocompleteProps = {
  value: LicenceType | null;
  onChange: (licence: LicenceType | null) => void;
  competitionFede?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
};

/**
 * Calcule si la saison du licencié est valide pour l'année en cours
 */
function getSaisonStatus(saison: string | undefined): 'valid' | 'expired' | 'unknown' {
  if (!saison) return 'unknown';
  const currentYear = new Date().getFullYear();
  const saisonYear = parseInt(saison, 10);
  if (isNaN(saisonYear)) return 'unknown';
  return saisonYear >= currentYear ? 'valid' : 'expired';
}

/**
 * Indicateur visuel de la saison (point coloré)
 */
function SaisonIndicator({ saison }: { saison: string | undefined }) {
  const status = getSaisonStatus(saison);
  return (
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full',
        status === 'valid' && 'bg-green-500',
        status === 'expired' && 'bg-red-500',
        status === 'unknown' && 'bg-gray-400'
      )}
      title={
        status === 'valid'
          ? 'Licence à jour'
          : status === 'expired'
            ? 'Licence périmée'
            : 'Saison non renseignée'
      }
    />
  );
}

/**
 * Élément de licence dans la liste déroulante
 * Affichage:
 * - Ligne 1: NOM Prénom (bold pour le nom)
 * - Ligne 2: Club
 * - Ligne 3: Catégorie valeur + Catégorie age + Fédération
 * - Ligne 4: Lic. N°, Année, Dept, Genre, Saison
 */
function LicenceItem({
  licence,
  competitionFede,
  onClick,
}: {
  licence: LicenceType;
  competitionFede?: string;
  onClick: () => void;
}) {
  const isSameFede = competitionFede && licence.fede === competitionFede;

  return (
    <button
      type="button"
      className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer border-b border-border last:border-b-0"
      onClick={onClick}
    >
      {/* Ligne 1: Nom Prénom */}
      <div className="flex items-center gap-2">
        <span className="font-semibold">{licence.name}</span>
        <span>{licence.firstName}</span>
        {licence.comment && (
          <span title={licence.comment}>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </span>
        )}
      </div>

      {/* Ligne 2: Club */}
      <div className="text-sm text-muted-foreground">{licence.club || 'Pas de club'}</div>

      {/* Ligne 3: Catégorie */}
      <div className={cn('text-sm', isSameFede ? 'font-semibold text-primary' : 'text-foreground')}>
        {licence.catev} {licence.catea} {licence.fede}
      </div>

      {/* Ligne 4: Infos licence */}
      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
        <span>Lic. N°: {licence.licenceNumber || 'N/A'}</span>
        <span>Année: {licence.birthYear}</span>
        <span>Dept: {licence.dept}</span>
        <span>Genre: {licence.gender}</span>
        <span>Saison: {licence.saison || 'N/A'}</span>
        <SaisonIndicator saison={licence.saison} />
      </div>
    </button>
  );
}

export function LicenceAutocomplete({
  value,
  onChange,
  competitionFede,
  disabled = false,
  error,
  required,
}: LicenceAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const { searchTerm, setSearchTerm, licences, isLoading, isSearching } = useSearchLicences();

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open, setSearchTerm]);

  const handleSelect = (licence: LicenceType) => {
    onChange(licence);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (disabled) return;
    setOpen(isOpen);
  };

  const displayValue = value
    ? `${value.name} ${value.firstName} - ${value.club || 'Sans club'}`
    : null;

  return (
    <div className="space-y-2">
      <Label>
        Saisir coureur
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className={cn(!value && 'text-muted-foreground', 'truncate')}>
              {displayValue || 'Rechercher un licencié...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-[400px] overflow-hidden p-0"
          align="start"
        >
          <div className="p-2 border-b">
            <Input
              placeholder="Rechercher par nom, prénom ou numéro de licence..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>
          <div
            className="max-h-80 overflow-y-auto overscroll-contain"
            onWheel={e => e.stopPropagation()}
          >
            {isLoading || isSearching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recherche en cours...
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="py-6 px-4 text-sm text-muted-foreground text-center">
                Saisissez au moins 2 caractères pour rechercher
              </div>
            ) : licences.length > 0 ? (
              <div className="p-1">
                {licences.map(licence => (
                  <LicenceItem
                    key={licence.id}
                    licence={licence}
                    competitionFede={competitionFede}
                    onClick={() => handleSelect(licence)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 px-4 text-sm text-muted-foreground text-center">
                Aucun licencié trouvé pour "{searchTerm}"
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
