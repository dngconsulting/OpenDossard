import { Controller, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { HTMLInputAutoCompleteAttribute } from 'react';

type PhoneFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  field: Path<T>;
  label?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
};

// Ne garde que les chiffres, ramène un préfixe « +33 » ou « 0033 » au format
// national « 0… » et borne à 10 chiffres.
const toNationalDigits = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  const international = digits.match(/^(?:00)?33(\d{9})$/);
  return (international ? `0${international[1]}` : digits).slice(0, 10);
};

/**
 * Téléphone français : saisi et affiché « 06 12 34 56 78 », stocké en
 * 10 chiffres sans séparateur (format de `user.phone` depuis la migration 1788).
 * À combiner avec `phoneSchema` pour la validation.
 */
export function PhoneField<T extends FieldValues>({
  form,
  field,
  label = 'Téléphone',
  autoComplete = 'tel',
}: PhoneFieldProps<T>) {
  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: f, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${f.name}-input`}>{label}</FieldLabel>
          <Input
            id={`${f.name}-input`}
            name={f.name}
            ref={f.ref}
            value={(f.value as string | undefined)?.replace(/(\d{2})(?=\d)/g, '$1 ') ?? ''}
            onChange={e => f.onChange(toNationalDigits(e.target.value))}
            onBlur={f.onBlur}
            placeholder="06 12 34 56 78"
            type="tel"
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
