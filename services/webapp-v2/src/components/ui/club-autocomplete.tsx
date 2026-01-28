'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ClubType } from '@/types/clubs';

type ClubAutocompleteProps = {
  clubs: ClubType[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function ClubAutocomplete({
  clubs,
  selected,
  onChange,
  placeholder = 'Rechercher un club...',
  className,
}: ClubAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return clubs
      .filter(c => {
        const name = (c.longName || c.shortName || '').toLowerCase();
        return name.includes(q) && !selected.includes(c.longName);
      })
      .slice(0, 20);
  }, [search, clubs, selected]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectClub = (clubName: string) => {
    onChange([...selected, clubName]);
    setSearch('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeClub = (clubName: string) => {
    onChange(selected.filter(c => c !== clubName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, filtered.length - 1));
      scrollToHighlighted(Math.min(highlightIndex + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
      scrollToHighlighted(Math.max(highlightIndex - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlightIndex]) {
      e.preventDefault();
      selectClub(filtered[highlightIndex].longName);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !search && selected.length > 0) {
      removeClub(selected[selected.length - 1]);
    }
  };

  const scrollToHighlighted = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className="flex items-center gap-1 flex-wrap border rounded-md bg-background shadow-xs px-2 min-h-9 cursor-text focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {selected.map(name => (
          <Badge key={name} variant="secondary" className="text-xs gap-0.5 max-w-[180px] shrink-0 h-6">
            <span className="truncate">{name}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeClub(name); }}
              className="hover:text-destructive shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => search.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length > 0 ? 'Ajouter...' : placeholder}
          className="flex-1 min-w-[100px] h-7 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {(search || selected.length > 0) && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setSearch('');
              onChange([]);
              setOpen(false);
            }}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 top-full mt-1 w-full max-h-52 overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {filtered.map((club, i) => (
            <button
              key={club.id}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                i === highlightIndex && 'bg-accent text-accent-foreground',
              )}
              onMouseEnter={() => setHighlightIndex(i)}
              onClick={() => selectClub(club.longName)}
            >
              <span className="font-medium">{club.longName}</span>
              {club.dept && (
                <span className="text-muted-foreground ml-1.5 text-xs">({club.dept})</span>
              )}
              {club.fede && (
                <span className="text-muted-foreground ml-1 text-xs">&middot; {club.fede}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && search.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md px-3 py-2">
          <p className="text-sm text-muted-foreground">Aucun club trouvé</p>
        </div>
      )}
    </div>
  );
}
