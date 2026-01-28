import { CalendarIcon, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DATE_FORMAT = 'dd/MM/yyyy';

type DatePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = 'JJ/MM/AAAA',
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value ? format(value, DATE_FORMAT) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    if (!raw) {
      onChange(undefined);
      return;
    }

    if (raw.length === 10) {
      const parsed = parse(raw, DATE_FORMAT, new Date(), { locale: fr });
      if (isValid(parsed) && parsed.getFullYear() > 1900) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    setInputValue(value ? format(value, DATE_FORMAT) : '');
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setInputValue(date ? format(date, DATE_FORMAT) : '');
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-[170px] pr-16 font-mono text-sm"
      />
      <div className="absolute right-1 flex items-center gap-0.5">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              defaultMonth={value}
            />
            <div className="border-t px-3 pb-3 pt-2">
              <button
                type="button"
                onClick={() => handleCalendarSelect(new Date())}
                className="w-full text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Aujourd'hui
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
