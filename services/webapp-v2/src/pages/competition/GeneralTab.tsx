import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPin } from 'lucide-react';

import { ClubAutocomplete } from '@/components/ClubAutocomplete';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

import { ContactSection, OptionsSection, OrganisationSection } from './general-sections';
import {
  COMPETITION_TYPE_OPTIONS,
  FEDE_OPTIONS_ALL,
  FEDE_OPTIONS_CREATE,
  getProfileOptions,
  type FormValues,
} from './types';

interface GeneralTabProps {
  isCreating: boolean;
  isDuplicating?: boolean;
}

const HIGHLIGHT_CLASS = 'bg-amber-100 dark:bg-amber-900/30 border-amber-400';

export function GeneralTab({ isCreating, isDuplicating }: GeneralTabProps) {
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
    <Card className="rounded-t-none border-t-0">
      <CardHeader className="pt-4">
        <CardTitle>
          <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
            Informations générales
          </span>
        </CardTitle>
        <CardDescription>
          Renseignez les informations principales de l'épreuve
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  <Input type="datetime-local" {...field} className={isDuplicating && !field.value ? HIGHLIGHT_CLASS : ''} />
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
                  <FormLabel>Club organisateur <span className="text-destructive">*</span></FormLabel>
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

        <Separator />

        <ContactSection isDuplicating={isDuplicating} />

        {!isCreating && (
          <>
            <Separator />
            <OrganisationSection competitionType={watchedCompetitionType} />
          </>
        )}

        <Separator />

        <OptionsSection />

        <Separator />

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
      </CardContent>
    </Card>
  );
}
