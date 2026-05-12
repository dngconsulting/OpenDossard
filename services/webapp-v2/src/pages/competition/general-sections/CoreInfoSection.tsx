import { MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { ClubAutocomplete } from '@/components/ClubAutocomplete';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  COMPETITION_TYPE_OPTIONS,
  FEDE_OPTIONS_ALL,
  FEDE_OPTIONS_CREATE,
  getProfileOptions,
  type FormValues,
} from '../types';

interface CoreInfoSectionProps {
  isCreating: boolean;
  isDuplicating?: boolean;
}

const HIGHLIGHT_CLASS = 'bg-amber-100 dark:bg-amber-900/30 border-amber-400';

/**
 * Grille principale des champs identitaires d'une épreuve (nom, date, type,
 * profil, fédération, code postal, longueur circuit, club organisateur).
 */
export function CoreInfoSection({ isCreating, isDuplicating }: CoreInfoSectionProps) {
  const form = useFormContext<FormValues>();

  const watchedFede = form.watch('fede');
  const watchedZipCode = form.watch('zipCode');
  const watchedCompetitionType = form.watch('competitionType');

  const deptFromZip = useMemo(() => {
    if (watchedZipCode && watchedZipCode.length >= 2) {
      return watchedZipCode.substring(0, 2);
    }
    return '';
  }, [watchedZipCode]);

  const profileOptions = useMemo(
    () => getProfileOptions(watchedCompetitionType),
    [watchedCompetitionType],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nom de l'épreuve <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="ex: Course de Lombez" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="eventDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Date et heure <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                {...field}
                className={isDuplicating && !field.value ? HIGHLIGHT_CLASS : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="competitionType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Type <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              key={`type-${field.value}`}
              onValueChange={field.onChange}
              value={field.value || undefined}
              disabled={!isCreating}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COMPETITION_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="info"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profil</FormLabel>
            <Select
              key={`info-${field.value}`}
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un profil" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {profileOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fede"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Fédération <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              key={`fede-${field.value}`}
              onValueChange={field.onChange}
              value={field.value || undefined}
              disabled={!isCreating}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une fédération" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(isCreating ? FEDE_OPTIONS_CREATE : FEDE_OPTIONS_ALL).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="zipCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Code postal <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="ex: 31000"
                  maxLength={5}
                  {...field}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="longueurCircuit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Longueur circuit</FormLabel>
            <FormControl>
              <Input placeholder="ex: 5km" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedFede && deptFromZip && (
        <FormField
          control={form.control}
          name="clubId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Club organisateur <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <ClubAutocomplete
                  value={field.value ?? null}
                  onChange={clubId => field.onChange(clubId)}
                  fede={watchedFede}
                  department={deptFromZip}
                  error={fieldState.error?.message}
                  label=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
