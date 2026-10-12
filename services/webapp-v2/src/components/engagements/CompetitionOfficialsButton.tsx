import { Flag } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateCompetitionOfficials } from '@/hooks/useCompetitions';
import type { CompetitionDetailType, CompetitionOfficials } from '@/types/competitions';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

type Props = {
  competition: CompetitionDetailType;
};

type OfficialsFormValues = Record<keyof CompetitionOfficials, string>;

/**
 * Valeurs historiques saisies sur plusieurs lignes : un `<input>` supprime les
 * retours à la ligne et recollerait les noms (« JC TROUVEA PUGNET »).
 */
const toSingleLine = (value: string | undefined) =>
  (value || '')
    .split(/\r?\n/)
    .map(name => name.trim())
    .filter(Boolean)
    .join(', ');

/**
 * Bouton + modale de saisie des arbitres/commissaires, posés dans la barre
 * d'outils de l'écran des engagements. Ouverts à tout organisateur, même non
 * rattaché au club de l'épreuve (endpoint dédié `PATCH /competitions/:id/officials`,
 * sans scope club) : ce sont souvent ceux qui engagent qui saisissent ces infos.
 */
export function CompetitionOfficialsButton({ competition }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" />
        Arbitres/Commissaires
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Arbitres/Commissaires
            </DialogTitle>
            <DialogDescription>
              Officiels de l'épreuve, repris sur les classements et la fiche épreuve.
            </DialogDescription>
          </DialogHeader>
          {/* Monté à chaque ouverture (Radix démonte le contenu fermé) : le formulaire
              repart toujours des valeurs courantes de l'épreuve. */}
          <OfficialsForm competition={competition} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function OfficialsForm({
  competition,
  onDone,
}: {
  competition: CompetitionDetailType;
  onDone: () => void;
}) {
  const updateOfficials = useUpdateCompetitionOfficials();
  const form = useForm<OfficialsFormValues>({
    defaultValues: {
      commissaires: toSingleLine(competition.commissaires),
      speaker: toSingleLine(competition.speaker),
      aboyeur: toSingleLine(competition.aboyeur),
      feedback: competition.feedback || '',
    },
  });

  const onSubmit = async (data: OfficialsFormValues) => {
    try {
      // Champ vide → null : les PDF affichent alors « NC » (`?? 'NC'`).
      const officials = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value.trim() || null]),
      ) as CompetitionOfficials;
      await updateOfficials.mutateAsync({ id: competition.id, data: officials });
      showSuccessToast('Arbitres/commissaires mis à jour');
      onDone();
    } catch {
      // Erreur affichée par le `MutationCache.onError` global (cf. `App.tsx`).
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="commissaires"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commissaires</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
              </FormItem>
            )}
          />

          {competition.competitionType === 'CX' && (
            <FormField
              control={form.control}
              name="aboyeur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aboyeur</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note commissaire(s)</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={updateOfficials.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={updateOfficials.isPending}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
