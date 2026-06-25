import { useFormContext } from 'react-hook-form';

import { HelloAssoStatusNotices } from '@/components/HelloAssoStatusNotices';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';
import type { PricingItem } from '@/types/competitions';

import { parseTarifAmount } from '../pricing-utils';

import type { FormValues } from '../types';

/**
 * Toggle "Paiement en ligne via HelloAsso" — visible uniquement si le club
 * organisateur a une liaison HelloAsso (ligne `helloasso_details` existante).
 * Si la liaison est expirée (refresh_token > 30j), affiche un warning incitant
 * l'admin à re-passer par la mire avant que des coureurs essaient de payer.
 *
 * Transition OFF→ON : nettoie chaque `pricing.tarif` — si parsable en number
 * positif, on coerce en number ; sinon on vide (la string libre ne peut plus
 * servir de montant payable). L'admin doit re-saisir les valeurs vidées.
 */
export function HelloAssoOnlinePaymentSection() {
  const form = useFormContext<FormValues>();
  const watchedClubId = form.watch('clubId');

  const status = useHelloAssoStatus(watchedClubId ?? undefined);
  const data = status.data;
  if (!data || !data.linked) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="onlineRegistrationEnabled"
      render={({ field }) => (
        <FormItem className="rounded-lg border-2 border-[#4B3FCF]/40 bg-[#4B3FCF]/5 dark:bg-[#4B3FCF]/15 p-4 space-y-3">
          {/* Ligne label + switch : bloc flex isolé pour que les bandeaux de
              statut (dynamiques) ne décalent pas l'alignement (cf. règle
              flexbox — contenu dynamique hors de la flex row). */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="https://api.helloasso.com/v5/img/logo-ha.svg"
                alt="HelloAsso"
                className="h-7 w-7 shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <FormLabel className="text-base font-semibold cursor-pointer m-0">
                  {field.value ? 'Désactiver' : 'Activer'} paiement en ligne via HelloAsso
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Permet aux coureurs de payer leur inscription directement depuis l&apos;app
                  Dossardeur.
                </p>
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  if (checked && !field.value) {
                    // OFF → ON : nettoie les tarifs non-numériques
                    const pricing = (form.getValues('pricing') ?? []) as PricingItem[];
                    const cleaned = pricing.map(p => {
                      const parsed = parseTarifAmount(p.tarif);
                      return parsed != null ? { ...p, tarif: parsed } : { ...p, tarif: '' };
                    });
                    form.setValue('pricing', cleaned, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                  field.onChange(checked);
                }}
              />
            </FormControl>
          </div>

          {/* Bandeaux d'état de la liaison HelloAsso (vérification compte +
              connecté/renouvellement), identiques à la fiche club. */}
          <HelloAssoStatusNotices status={data} />
        </FormItem>
      )}
    />
  );
}
