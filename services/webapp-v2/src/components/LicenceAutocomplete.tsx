import { Loader2, AlertCircle, User, MapPin, Calendar, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
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
 * Avatar avec initiales
 */
function Avatar({ name, firstName, gender }: { name: string; firstName: string; gender?: string }) {
  const initials = `${firstName?.[0] || ''}${name?.[0] || ''}`.toUpperCase();
  return (
    <div
      className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white',
        gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'
      )}
    >
      {initials || <User className="h-5 w-5" />}
    </div>
  );
}

/**
 * Élément de licence dans la liste déroulante - Design moderne
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
  const saisonStatus = getSaisonStatus(licence.saison);

  return (
    <button
      type="button"
      className="w-full text-left p-3 hover:bg-muted/80 rounded-lg cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar name={licence.name} firstName={licence.firstName} gender={licence.gender} />

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          {/* Ligne 1: Nom + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {licence.name} {licence.firstName}
            </span>
            {licence.comment && (
              <span title={licence.comment}>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </span>
            )}
            <Badge
              variant={saisonStatus === 'valid' ? 'default' : saisonStatus === 'expired' ? 'destructive' : 'secondary'}
              className={cn(
                'text-[10px] px-1.5 py-0',
                saisonStatus === 'valid' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              )}
            >
              {licence.saison || 'N/A'}
            </Badge>
          </div>

          {/* Ligne 2: Club */}
          <div className="text-sm text-muted-foreground truncate mt-0.5">
            {licence.club || 'Sans club'}
          </div>

          {/* Ligne 3: Infos compactes */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <Badge
              variant={isSameFede ? 'default' : 'outline'}
              className={cn(
                'font-medium',
                isSameFede && 'bg-primary/10 text-primary border-primary/20'
              )}
            >
              {licence.catev} · {licence.catea} · {licence.fede}
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {licence.birthYear}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {licence.dept || '—'}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground/70">
              <CreditCard className="h-3 w-3" />
              {licence.licenceNumber || 'N/A'}
            </span>
          </div>
        </div>
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
  const [inputValue, setInputValue] = useState('');
  const { searchTerm, setSearchTerm, licences, isLoading, isSearching } = useSearchLicences();

  // Sync input value with selected licence display
  useEffect(() => {
    if (value) {
      setInputValue(`${value.name} ${value.firstName} - ${value.club || 'Sans club'}`);
    }
  }, [value]);

  const handleSelect = (licence: LicenceType) => {
    onChange(licence);
    setInputValue(`${licence.name} ${licence.firstName} - ${licence.club || 'Sans club'}`);
    setOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    // Clear selection if user modifies the input
    if (value) {
      onChange(null);
    }
    if (newValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleFocus = () => {
    if (inputValue.length >= 2 && !value) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click on results
    setTimeout(() => setOpen(false), 200);
  };

  return (
    <div className="space-y-2">
      <Label>
        Saisir coureur
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              placeholder="Rechercher par nom, prénom ou numéro de licence..."
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              className={cn(error && 'border-destructive')}
            />
            {(isLoading || isSearching) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 shadow-lg border-border/50"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div
            className="max-h-[400px] overflow-y-auto overscroll-contain"
            onWheel={e => e.stopPropagation()}
          >
            {searchTerm.length >= 2 && (
              licences.length > 0 ? (
                <div className="py-2">
                  {licences.map((licence, index) => (
                    <div key={licence.id}>
                      {index > 0 && <div className="mx-3 border-t border-border/50" />}
                      <LicenceItem
                        licence={licence}
                        competitionFede={competitionFede}
                        onClick={() => handleSelect(licence)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 text-sm text-muted-foreground text-center">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucun licencié trouvé pour "{searchTerm}"
                </div>
              )
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
