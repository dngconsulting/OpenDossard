import { useFormContext } from 'react-hook-form';
import { Facebook, Globe, Mail, Phone } from 'lucide-react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { FormValues } from '../types';

interface ContactSectionProps {
  isDuplicating?: boolean;
}

const HIGHLIGHT_CLASS = 'bg-amber-100 dark:bg-amber-900/30 border-amber-400';

export function ContactSection({ isDuplicating }: ContactSectionProps) {
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <h4 className="font-medium">
        <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
          Contact
        </span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom contact</FormLabel>
              <FormControl>
                <Input placeholder="Prénom NOM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => {
            const formatPhone = (digits: string) =>
              digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
            return (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="06 12 34 56 78"
                      maxLength={14}
                      {...field}
                      value={formatPhone(field.value ?? '')}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        field.onChange(digits);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="email"
                    placeholder="contact@example.com"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siteweb"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site web</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className={`pl-9 ${isDuplicating && !field.value ? HIGHLIGHT_CLASS : ''}`} placeholder="https://..." {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook</FormLabel>
              <FormControl>
                <div className="relative">
                  <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className={`pl-9 ${isDuplicating && !field.value ? HIGHLIGHT_CLASS : ''}`}
                    placeholder="https://facebook.com/..."
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
