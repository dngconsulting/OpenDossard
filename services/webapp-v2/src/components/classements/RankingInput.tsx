import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DNF_CODES, DNF_LABELS, type DNFCode } from '@/types/races';
import { cn } from '@/lib/utils';

type RankingInputProps = {
  value: string;
  comment?: string | null;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onNavigateDown?: () => void;
  onNavigateNext?: () => void;
};

export function RankingInput({
  value: initialValue,
  comment,
  onSubmit,
  disabled = false,
  placeholder = '---',
  className,
  onNavigateDown,
  onNavigateNext,
}: RankingInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSubmittedRef = useRef(false);

  // Sync avec la valeur externe
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Un coureur est présent si on a un dossard valide (numérique)
  const hasRider = initialValue !== '' && !isNaN(parseInt(initialValue, 10));

  // Déterminer si la valeur actuelle est un code DNF
  const isDNF = comment != null && DNF_CODES.includes(comment as DNFCode);

  const handleSubmit = useCallback(() => {
    if (hasSubmittedRef.current) return;

    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== initialValue) {
      hasSubmittedRef.current = true;
      onSubmit(trimmed);
      // Reset après un délai plus long que handleBlur (150ms)
      setTimeout(() => {
        hasSubmittedRef.current = false;
      }, 300);
    }
    setIsOpen(false);
  }, [inputValue, initialValue, onSubmit]);

  const handleSelectDNF = useCallback((code: DNFCode) => {
    hasSubmittedRef.current = true;
    onSubmit(code);
    setIsOpen(false);
    setTimeout(() => {
      hasSubmittedRef.current = false;
    }, 300);
    // Naviguer au suivant
    onNavigateNext?.();
  }, [onSubmit, onNavigateNext]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      onNavigateNext?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(initialValue);
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      onNavigateDown?.();
    } else if (e.key === 'Tab') {
      handleSubmit();
      // Laisser Tab faire son comportement normal
    }
  }, [handleSubmit, initialValue, isOpen, onNavigateDown, onNavigateNext]);

  const handleBlur = useCallback(() => {
    // Petit délai pour permettre le clic sur le dropdown
    setTimeout(() => {
      if (!hasSubmittedRef.current) {
        handleSubmit();
      }
    }, 150);
  }, [handleSubmit]);

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    // Sélectionner tout le texte
    inputRef.current?.select();
  }, []);

  return (
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          {isDNF ? (
            // Affichage lecture seule pour DNF : "{Dossard}-{Motif}"
            <div
              className="h-8 w-24 text-center font-mono flex items-center justify-center border rounded-md bg-background cursor-pointer text-sm"
              onClick={() => !disabled && setIsOpen(true)}
            >
              <span>{initialValue}-</span>
              <span className="text-orange-600 font-semibold">{comment}</span>
            </div>
          ) : (
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={handleFocus}
              disabled={disabled}
              placeholder={placeholder}
              className="h-8 w-24 text-center pr-7 font-mono"
            />
          )}
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-1"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="text-xs text-muted-foreground px-2 py-1 border-b mb-1">
          Codes abandon
        </div>
        {DNF_CODES.map((code) => (
          <button
            key={code}
            type="button"
            disabled={!hasRider}
            className={cn(
              'w-full text-left px-2 py-1.5 text-sm rounded flex items-center justify-between',
              hasRider
                ? 'hover:bg-accent cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => hasRider && handleSelectDNF(code)}
          >
            <span className={cn('font-mono font-semibold', hasRider ? 'text-orange-600' : 'text-muted-foreground')}>
              {code}
            </span>
            <span className="text-muted-foreground text-xs">{DNF_LABELS[code]}</span>
          </button>
        ))}
        {!hasRider && (
          <div className="text-xs text-muted-foreground px-2 py-2 italic border-t mt-1">
            Saisissez d'abord un dossard
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
