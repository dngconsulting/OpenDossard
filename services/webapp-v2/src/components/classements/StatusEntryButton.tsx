import { ChevronDown, Flag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { DNF_CODES, DNF_LABELS, type DNFCode } from '@/types/races';

type StatusEntryButtonProps = {
  /** Code de statut actuellement armé (`null` = aucun mode actif). */
  value: DNFCode | null;
  /** Notifie le parent du nouveau code armé (`null` quand on désarme). */
  onChange: (code: DNFCode | null) => void;
};

/**
 * Bouton « Saisir DNF/ABD » placé dans la toolbar, à gauche de « Engagés ».
 *
 * Au clic, ouvre un popover listant les codes d'abandon sous forme de boutons
 * bascule exclusifs (un seul actif à la fois). Sélectionner un code « arme » le
 * mode de saisie : le libellé du bouton devient « Saisir ABD », et le bouton se
 * teinte en orange pour signaler qu'un mode est actif. Re-cliquer sur le code
 * actif le désarme.
 *
 * NB : pour l'instant purement visuel — le code armé est exposé au parent via
 * `onChange` mais aucune action de saisie n'est encore branchée.
 */
export function StatusEntryButton({ value, onChange }: StatusEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isArmed = value !== null;
  const label = isArmed ? `Saisie en cours des ${value}` : 'Saisir DNF/ABD';

  // L'item armé remonte en tête de liste ; les autres gardent leur ordre.
  const orderedCodes: readonly DNFCode[] = value
    ? [value, ...DNF_CODES.filter(c => c !== value)]
    : DNF_CODES;

  const handleValueChange = (next: string) => {
    // ToggleGroup `single` renvoie '' quand on désélectionne l'item actif.
    onChange(next === '' ? null : (next as DNFCode));
    // Une fois le statut choisi, on referme le popover pour passer à la saisie.
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          title="Choisir un statut ABD et désélectionner"
          className={cn(
            isArmed &&
              'border-orange-500 text-orange-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30',
          )}
        >
          <Flag className="h-4 w-4" />
          {label}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-1" align="end">
        <div className="text-xs text-muted-foreground px-2 py-1 border-b mb-1">Codes abandon</div>
        <ToggleGroup
          type="single"
          value={value ?? ''}
          onValueChange={handleValueChange}
          spacing={1}
          className="flex-col w-full"
        >
          {orderedCodes.map(code => {
            const isItemArmed = value === code;
            return (
              <ToggleGroupItem
                key={code}
                value={code}
                className="w-full justify-between px-2 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 dark:data-[state=on]:bg-orange-950/40"
              >
                {isItemArmed ? (
                  // Item armé : cliquer à nouveau désarme → libellé d'arrêt.
                  <span className="font-semibold text-orange-700">Arrêter saisie {code}</span>
                ) : (
                  <>
                    <span className="font-mono font-semibold text-orange-600">{code}</span>
                    <span className="text-muted-foreground text-xs">{DNF_LABELS[code]}</span>
                  </>
                )}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
}
