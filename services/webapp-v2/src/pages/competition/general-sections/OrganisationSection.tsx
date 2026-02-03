import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { FormValues } from '../types';

interface OrganisationSectionProps {
  competitionType: string | undefined;
}

export function OrganisationSection({ competitionType }: OrganisationSectionProps) {
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <h4 className="font-medium">
        <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
          Organisation (après création)
        </span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="commissaires"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commissaires</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="speaker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Speaker</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {competitionType === 'CX' && (
          <FormField
            control={form.control}
            name="aboyeur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aboyeur</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Note commissaire(s)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
