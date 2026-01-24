import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DNF_CODES, DNF_LABELS, type DNFCode } from '@/types/races';
import { cn } from '@/lib/utils';

type RankingInputProps = {
  value: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onNavigateDown?: () => void;
  onNavigateNext?: () => void;
};

export function RankingInput({
  value: initialValue,
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

  const handleSubmit = useCallback(() => {
    if (hasSubmittedRef.current) return;

    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== initialValue) {
      hasSubmittedRef.current = true;
      onSubmit(trimmed);
      // Reset après un court délai
      setTimeout(() => {
        hasSubmittedRef.current = false;
      }, 100);
    }
    setIsOpen(false);
  }, [inputValue, initialValue, onSubmit]);

  const handleSelectDNF = useCallback((code: DNFCode) => {
    setInputValue(code);
    hasSubmittedRef.current = true;
    onSubmit(code);
    setIsOpen(false);
    setTimeout(() => {
      hasSubmittedRef.current = false;
    }, 100);
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

  // Déterminer si la valeur est un code DNF
  const isDNF = DNF_CODES.includes(inputValue as DNFCode);

  return (
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
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
            className={cn(
              'h-8 w-20 text-center pr-6 font-mono',
              isDNF && 'text-orange-600 font-semibold'
            )}
          />
          <ChevronDown
            className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
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
            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center justify-between"
            onClick={() => handleSelectDNF(code)}
          >
            <span className="font-mono font-semibold text-orange-600">{code}</span>
            <span className="text-muted-foreground text-xs">{DNF_LABELS[code]}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
