import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Facebook, Globe, Mail, MapPin, Phone } from 'lucide-react';

import { ClubAutocomplete } from '@/components/ClubAutocomplete';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { CompetitionDetailType } from '@/types/competitions';

import {
  COMPETITION_TYPE_OPTIONS,
  FEDE_OPTIONS_ALL,
  FEDE_OPTIONS_CREATE,
  getProfileOptions,
  type FormValues,
} from './types';

interface GeneralTabProps {
  competition: CompetitionDetailType | undefined;
  isCreating: boolean;
}

export function GeneralTab({ competition, isCreating }: GeneralTabProps) {
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
      <CardHeader>
        <CardTitle>Informations generales</CardTitle>
        <CardDescription>
          Renseignez les informations principales de l'epreuve
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
                  Nom de l'epreuve <span className="text-destructive">*</span>
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
                  <Input type="datetime-local" {...field} />
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
                  key={`type-${competition?.id || 'new'}-${competition?.competitionType || ''}`}
                  onValueChange={field.onChange}
                  defaultValue={competition?.competitionType || field.value}
                  disabled={!isCreating}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un type" />
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
                  key={`info-${competition?.id || 'new'}-${competition?.info || ''}`}
                  onValueChange={field.onChange}
                  defaultValue={competition?.info || field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un profil" />
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
                  Federation <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  key={`fede-${competition?.id || 'new'}-${competition?.fede || ''}`}
                  onValueChange={field.onChange}
                  defaultValue={competition?.fede || field.value}
                  disabled={!isCreating}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner une federation" />
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
            <Controller
              control={form.control}
              name="clubId"
              render={({ field, fieldState }) => (
                <ClubAutocomplete
                  value={field.value ?? null}
                  onChange={clubId => field.onChange(clubId)}
                  fede={watchedFede}
                  department={deptFromZip}
                  error={fieldState.error?.message}
                />
              )}
            />
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Prenom NOM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telephone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="0612345678"
                        maxLength={10}
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
                      <Input className="pl-9" placeholder="https://..." {...field} />
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
                        className="pl-9"
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

        {!isCreating && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Organisation (apres creation)</h4>
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

                {watchedCompetitionType === 'CX' && (
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
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Options</h4>
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
                    Ouvert aux autres federations
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
                  <FormLabel className="font-normal">Ouvert aux non licencies</FormLabel>
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
                  <FormLabel className="font-normal">Competition chronometree</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

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
                  placeholder="Informations complementaires..."
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
