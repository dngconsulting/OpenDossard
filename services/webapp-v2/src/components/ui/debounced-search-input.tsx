import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  /** Valeur affichée dans l'input (state contrôlé par le parent) */
  value: string;
  /** Appelé à chaque frappe, sans debounce (mise à jour du state parent) */
  onValueChange: (value: string) => void;
  /** Appelé avec debounce — c'est lui qui déclenche la recherche serveur */
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  /** Longueur minimale avant de déclencher la recherche (la chaîne vide passe toujours, pour réinitialiser) */
  minLength?: number;
  className?: string;
};

/**
 * Champ de recherche standard (icône loupe + bouton d'effacement) dont
 * l'appel serveur est débouncé. Le bouton ✕ annule le debounce en attente
 * et réinitialise la recherche immédiatement.
 */
export function DebouncedSearchInput({
  value,
  onValueChange,
  onSearch,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  minLength = 0,
  className,
}: Props) {
  const debouncedSearch = useDebouncedCallback(onSearch, debounceMs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onValueChange(next);
    if (next.length === 0 || next.length >= minLength) {
      debouncedSearch(next);
    }
  };

  const clear = () => {
    onValueChange('');
    debouncedSearch.cancel();
    onSearch('');
  };

  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
