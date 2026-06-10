import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAccessibleClubs } from '@/hooks/useClubs';
import { useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';

import {
  CompetitionPushSection,
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
  /** Id de l'épreuve en édition — absent en création/duplication (pas de push possible). */
  competitionId?: number;
}

/**
 * Tab "Infos" de la page édition d'une épreuve. Orchestre les sections de
 * formulaire (chaque section est un sous-composant qui lit le `useFormContext`
 * directement). L'orchestrateur se contente d'agencer les sections + séparateurs.
 */
export function GeneralTab({ isCreating, isDuplicating, competitionId }: GeneralTabProps) {
  const form = useFormContext<FormValues>();
  const watchedCompetitionType = form.watch('competitionType');
  const watchedClubId = form.watch('clubId');
  // TanStack Query dedupe la requête identique faite dans HelloAssoOnlinePaymentSection,
  // donc pas de double appel HTTP — on partage juste le résultat.
  const helloAssoStatus = useHelloAssoStatus(watchedClubId ?? undefined);
  const showHelloAssoSection = helloAssoStatus.data?.linked === true;
  // Encart "Notifier les abonnés" : épreuve existante ET club organisateur dans
  // le scope du user (pas d'affichage optimiste pendant le chargement du scope —
  // on ne montre pas le bouton à un orga qui n'a pas le club). Un ADMIN
  // (scope ALL) voit l'encart même sur une épreuve sans club — aligné backend.
  // La section s'auto-garde avec la même règle (pattern HelloAsso) ; le check
  // ici ne sert qu'à ne pas rendre un <Separator /> orphelin.
  const accessibleClubs = useAccessibleClubs();
  const showPushSection =
    competitionId != null &&
    accessibleClubs.data != null &&
    (accessibleClubs.data.scope === 'ALL' || accessibleClubs.canEditClub(watchedClubId));

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

        {showPushSection && competitionId != null && (
          <>
            <Separator />
            <CompetitionPushSection competitionId={competitionId} />
          </>
        )}

        <Separator />

        <ObservationsSection />
      </CardContent>
    </Card>
  );
}
