import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import type { FormValues } from '../types';

export function OptionsSection() {
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <h4 className="font-medium">
        <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
          Options
        </span>
      </h4>
      <div className="flex flex-wrap gap-6">
        <FormField
          control={form.control}
          name="openedToOtherFede"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">
                Ouvert aux autres fédérations
              </FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openedNL"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Ouvert aux non licenciés</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avecChrono"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Compétition chronométrée</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
