import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';

import type { FormValues } from '../types';

/**
 * Toggle "Paiement en ligne via HelloAsso" — visible uniquement si le club
 * organisateur a une liaison HelloAsso (ligne `helloasso_details` existante).
 * Si la liaison est expirée (refresh_token > 30j), affiche un warning incitant
 * l'admin à re-passer par la mire avant que des coureurs essaient de payer.
 *
 * Retourne `null` si pas de club sélectionné ou pas de liaison. Le parent
 * est en charge du `<Separator>` (il appelle `useHelloAssoStatus` lui-même
 * via TanStack Query — la requête est dédupliquée, pas de double appel HTTP).
 */
export function HelloAssoOnlinePaymentSection() {
  const form = useFormContext<FormValues>();
  const watchedClubId = form.watch('clubId');

  const status = useHelloAssoStatus(watchedClubId ?? undefined);
  const data = status.data;
  if (!data || !data.linked) {
    return null;
  }
  const isExpired = data.expired;

  return (
    <FormField
      control={form.control}
      name="onlineRegistrationEnabled"
      render={({ field }) => (
        <FormItem className="rounded-lg border-2 border-[#4B3FCF]/40 bg-[#4B3FCF]/5 dark:bg-[#4B3FCF]/15 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://api.helloasso.com/v5/img/logo-ha.svg"
              alt="HelloAsso"
              className="h-7 w-7 shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <FormLabel className="text-base font-semibold cursor-pointer m-0">
                Paiement en ligne via HelloAsso
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Permet aux coureurs de payer leur inscription directement depuis l&apos;app Dossardeur.
                {isExpired ? (
                  <>
                    {' '}
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      ⚠ Liaison HelloAsso expirée — re-lier le club avant activation effective.
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <FormControl>
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
