import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Tous',
  className,
}: MultiSelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter(v => v !== value));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map(v => options.find(o => o.value === v)?.label || v).join(', ')
        : `${selected.length} sélectionnés`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 min-w-[160px] justify-between px-3 font-normal',
            selected.length === 0 && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate text-left">{displayText}</span>
          <div className="flex items-center gap-0.5 ml-2 shrink-0">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={e => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="rounded p-0.5 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Aucun résultat</p>
          ) : (
            filtered.map(option => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={checked => handleToggle(option.value, !!checked)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t mt-2 pt-2 flex flex-wrap gap-1">
            {selected.map(v => {
              const label = options.find(o => o.value === v)?.label || v;
              return (
                <Badge key={v} variant="secondary" className="text-xs gap-1">
                  {label}
                  <button
                    type="button"
                    onClick={() => handleToggle(v, false)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
