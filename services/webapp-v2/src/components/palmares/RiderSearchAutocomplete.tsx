import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLicenceSearch } from '@/hooks/usePalmares';
import type { LicenceType } from '@/types/licences';

type Props = {
  selectedLicence?: LicenceType;
  onClear?: () => void;
  isLoading?: boolean;
};

export function RiderSearchAutocomplete({
  selectedLicence,
  onClear,
  isLoading: isPageLoading,
}: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading: isSearchLoading } = useLicenceSearch(query);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (licence: LicenceType) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/palmares/${licence.id}`);
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
    navigate('/palmares');
  };

  if (isPageLoading) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (selectedLicence) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {selectedLicence.name} {selectedLicence.firstName}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {selectedLicence.club} • {selectedLicence.fede} #{selectedLicence.licenceNumber}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="rounded-xl border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un coureur (nom, prénom ou n° licence)..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="h-12 w-full rounded-lg border border-input bg-background pl-12 pr-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-card border rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {isSearchLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="p-2">
              {results.map(licence => (
                <button
                  key={licence.id}
                  onClick={() => handleSelect(licence)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {licence.name} {licence.firstName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {licence.club} • {licence.fede} #{licence.licenceNumber}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">Aucun résultat trouvé</div>
          )}
        </div>
      )}
    </div>
  );
}
