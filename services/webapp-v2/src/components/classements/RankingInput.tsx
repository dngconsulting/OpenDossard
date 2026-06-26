import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { DossardSubmitOutcome } from '@/types/races';

type RankingInputProps = {
  value: string;
  onSubmit: (value: string) => Promise<DossardSubmitOutcome>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  dnfArmed?: boolean;
  onNavigateDown?: () => void;
  onNavigateNext?: () => void;
};

/**
 * Champ de saisie d'un dossard dans le tableau des classements.
 *
 * La saisie d'un dossard classe le coureur (ou le marque DNF si un statut est
 * armé via le bouton « Saisir DNF/ABD » de la toolbar — la logique est portée
 * par `onSubmit` côté parent). Ce composant ne connaît plus les codes DNF :
 * l'ancien popover par ligne a été retiré au profit du mode armé global.
 */
export function RankingInput({
  value: initialValue,
  onSubmit,
  disabled = false,
  placeholder = '---',
  className,
  dnfArmed = false,
  onNavigateDown,
  onNavigateNext,
}: RankingInputProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSubmittedRef = useRef(false);

  // Sync avec la valeur externe
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handleSubmit = useCallback(async (): Promise<DossardSubmitOutcome> => {
    if (hasSubmittedRef.current) {
      return { markedDnf: false };
    }

    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === initialValue) {
      return { markedDnf: false };
    }

    hasSubmittedRef.current = true;
    let outcome: DossardSubmitOutcome = { markedDnf: false };
    try {
      outcome = await onSubmit(trimmed);
    } finally {
      if (outcome.markedDnf) {
        setInputValue('');
        hasSubmittedRef.current = false;
      } else {
        // Reset après un délai plus long que handleBlur (150ms)
        setTimeout(() => {
          hasSubmittedRef.current = false;
        }, 300);
      }
    }
    return outcome;
  }, [inputValue, initialValue, onSubmit]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const outcome = await handleSubmit();
        // En mode DNF, on consomme le passage au suivant : le focus reste sur le
        // champ (désormais vidé) pour enchaîner la saisie des dossards DNF.
        if (!outcome.markedDnf) {
          onNavigateNext?.();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue(initialValue);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigateDown?.();
      } else if (e.key === 'Tab') {
        // En mode DNF, Tab (avant) ne doit pas avancer : la ligne va partir en bas.
        // preventDefault doit être synchrone, avant l'await de handleSubmit.
        if (dnfArmed && !e.shiftKey) {
          e.preventDefault();
        }
        void handleSubmit();
      }
    },
    [handleSubmit, initialValue, dnfArmed, onNavigateDown, onNavigateNext],
  );

  const handleBlur = useCallback(() => {
    // Petit délai pour rester cohérent avec la saisie (évite un double submit)
    setTimeout(() => {
      if (!hasSubmittedRef.current) {
        handleSubmit();
      }
    }, 150);
  }, [handleSubmit]);

  const handleFocus = useCallback(() => {
    // Sélectionner tout le texte
    inputRef.current?.select();
  }, []);

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        'h-8 w-24 text-center font-mono',
        dnfArmed && 'focus-visible:border-orange-500 focus-visible:ring-orange-500/50',
        className,
      )}
    />
  );
}
