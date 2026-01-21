import { useFormContext } from 'react-hook-form';
import { MapPin } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { FormValues } from './types';

export function LocalisationTab() {
  const form = useFormContext<FormValues>();

  return (
    <Card className="rounded-t-none border-t-0">
      <CardHeader>
        <CardTitle>Localisation</CardTitle>
        <CardDescription>
          Indiquez le lieu de retrait des dossards et les coordonnees GPS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lieuDossard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lieu de retrait des dossards</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Salle des fetes de Lombez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lieuDossardGPS"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coordonnees GPS</FormLabel>
                <FormControl>
                  <Input placeholder="ex: 43.4731, 0.9114" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            La carte interactive sera disponible dans une prochaine version.
            <br />
            Vous pouvez saisir les coordonnees GPS manuellement ci-dessus.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
