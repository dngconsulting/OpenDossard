import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

import type { FormValues } from '../types';

/**
 * Champ "Notes de l'organisation" (texte riche libre). Utilisé pour les
 * informations complémentaires de l'épreuve qui ne rentrent dans aucune
 * section structurée.
 */
export function ObservationsSection() {
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="observations"
      render={({ field }) => (
        <FormItem>
          <h4 className="font-medium">
            <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
              Notes de l&apos;organisation
            </span>
          </h4>
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
