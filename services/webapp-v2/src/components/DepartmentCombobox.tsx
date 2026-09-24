import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDepartments } from '@/hooks/useDepartments';
import { cn } from '@/lib/utils';

type DepartmentComboboxProps = {
  value: string | undefined;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Sélecteur de département avec recherche (code ou nom), sans label ni
 * mise en page : à placer dans un `FormItem` / `FormControl`.
 */
export function DepartmentCombobox({
  value,
  onChange,
  placeholder = 'Sélectionner un département',
  disabled = false,
}: DepartmentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: departments, isLoading } = useDepartments();

  const options = useMemo(
    () => departments?.map(d => ({ value: d.code, label: `${d.code} - ${d.name}` })) ?? [],
    [departments],
  );

  const filteredOptions = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    if (!lowerSearch) {return options;}
    return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleOpenChange = (isOpen: boolean) => {
    if (disabled) {return;}
    setOpen(isOpen);
    if (!isOpen) {
      setSearch('');
    }
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setSearch('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal overflow-hidden"
          disabled={disabled}
        >
          <span className={cn('min-w-0 truncate', !selectedOption && 'text-muted-foreground')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] overflow-hidden p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Rechercher un département..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto overscroll-contain" onWheel={e => e.stopPropagation()}>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Aucun résultat</div>
          ) : (
            <div className="p-1">
              {filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === option.value && 'bg-accent',
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
