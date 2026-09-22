import { HelloAssoRoundLogo } from '@/components/common/HelloAssoRoundLogo';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ClubFilters, HelloAssoLinkFilter } from '@/types/clubs';

type Props = {
  filters: ClubFilters;
  /** Valeur vide = retirer le filtre (même contrat que `setFilter` de useClubsPaginated). */
  onFilterChange: (key: 'helloAsso' | 'organizer', value: string) => void;
};

const ALL = 'all';

/**
 * Filtres hors colonne de la page clubs : liaison HelloAsso (tri-état) et
 * « organisateur ». Cas d'usage cible : « Sans liaison » + « organisateurs »
 * = les clubs organisateurs d'épreuves à accompagner vers HelloAsso.
 */
export function ClubsHelloAssoFilters({ filters, onFilterChange }: Props) {
  const helloAsso: HelloAssoLinkFilter | typeof ALL =
    filters.helloAsso === 'linked' || filters.helloAsso === 'unlinked' ? filters.helloAsso : ALL;
  const organizerOnly = filters.organizer === 'true';

  return (
    <div className="flex flex-wrap items-center gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        value={helloAsso}
        // Radix renvoie '' quand on re-clique l'item actif : on garde l'état.
        onValueChange={v => {
          if (!v) {
            return;
          }
          onFilterChange('helloAsso', v === ALL ? '' : v);
        }}
        aria-label="Filtre liaison HelloAsso"
      >
        <ToggleGroupItem value={ALL} className="px-3">
          Tous
        </ToggleGroupItem>
        <ToggleGroupItem value="linked" className="px-3 gap-1.5">
          <HelloAssoRoundLogo size="1rem" />
          Pré-inscription possible
        </ToggleGroupItem>
        <ToggleGroupItem value="unlinked" className="px-3">
          Pré-inscription non configurée
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex items-center gap-1.5">
        <Checkbox
          className="border-2"
          id="clubs-organizer-only"
          checked={organizerOnly}
          onCheckedChange={checked => onFilterChange('organizer', checked === true ? 'true' : '')}
        />
        <label
          htmlFor="clubs-organizer-only"
          className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer"
        >
          Clubs organisateurs uniquement
        </label>
      </div>
    </div>
  );
}
