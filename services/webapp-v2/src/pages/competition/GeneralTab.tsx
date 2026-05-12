import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';

import {
  ContactSection,
  CoreInfoSection,
  HelloAssoOnlinePaymentSection,
  ObservationsSection,
  OptionsSection,
  OrganisationSection,
} from './general-sections';
import type { FormValues } from './types';

interface GeneralTabProps {
  isCreating: boolean;
  isDuplicating?: boolean;
}

/**
 * Tab "Infos" de la page édition d'une épreuve. Orchestre les sections de
 * formulaire (chaque section est un sous-composant qui lit le `useFormContext`
 * directement). L'orchestrateur se contente d'agencer les sections + séparateurs.
 */
export function GeneralTab({ isCreating, isDuplicating }: GeneralTabProps) {
  const form = useFormContext<FormValues>();
  const watchedCompetitionType = form.watch('competitionType');
  const watchedClubId = form.watch('clubId');
  // TanStack Query dedupe la requête identique faite dans HelloAssoOnlinePaymentSection,
  // donc pas de double appel HTTP — on partage juste le résultat.
  const helloAssoStatus = useHelloAssoStatus(watchedClubId ?? undefined);
  const showHelloAssoSection = helloAssoStatus.data?.linked === true;

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
        <CoreInfoSection isCreating={isCreating} isDuplicating={isDuplicating} />

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

        {showHelloAssoSection && (
          <>
            <Separator />
            <HelloAssoOnlinePaymentSection />
          </>
        )}

        <Separator />

        <ObservationsSection />
      </CardContent>
    </Card>
  );
}
