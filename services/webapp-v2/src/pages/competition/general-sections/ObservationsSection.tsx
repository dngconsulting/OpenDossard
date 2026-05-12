import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

import type { FormValues } from '../types';

/**
 * Champ "Observations" (texte riche libre). Utilisé pour les informations
 * complémentaires de l'épreuve qui ne rentrent dans aucune section structurée.
 */
export function ObservationsSection() {
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="observations"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observations</FormLabel>
          <FormControl>
            <RichTextEditor
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Informations complémentaires..."
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
