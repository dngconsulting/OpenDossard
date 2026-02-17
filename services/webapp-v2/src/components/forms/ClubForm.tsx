import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSuccessToast } from '@/utils/error-handler/error-handler';
import { z } from 'zod';

import { clubsApi } from '@/api/clubs.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup, FieldSet, StringField, SelectField } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { useCreateClub, useUpdateClub } from '@/hooks/useClubs';
import { FEDERATION_OPTIONS } from '@/types/api';
import type { ClubType, ClubReferences } from '@/types/clubs';

const createFormSchema = (isCreating: boolean) =>
  z.object({
    shortName: z.string().optional(),
    longName: z.string().min(1, 'Le nom long est requis'),
    elicenceName: z.string().optional(),
    dept: z.string().min(1, 'Le département est requis'),
    fede: isCreating ? z.string().min(1, 'La fédération est requise') : z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

type ClubFormProps = {
  club?: ClubType;
  isCreating: boolean;
  onSuccess: (club?: ClubType) => void;
  formId?: string;
  onPendingChange?: (isPending: boolean) => void;
};

export const ClubForm = ({ club, isCreating, onSuccess, formId, onPendingChange }: ClubFormProps) => {
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();
  const [propagateDialog, setPropagateDialog] = useState<{
    references: ClubReferences;
    formData: FormValues;
  } | null>(null);

  const formSchema = createFormSchema(isCreating);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shortName: club?.shortName ?? '',
      longName: club?.longName ?? '',
      elicenceName: club?.elicenceName ?? '',
      dept: club?.dept ?? '',
      fede: club?.fede ?? '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    onPendingChange?.(true);
    if (isCreating) {
      try {
        const created = await createClub.mutateAsync({
          shortName: data.shortName || null,
          longName: data.longName,
          elicenceName: data.elicenceName || null,
          dept: data.dept || null,
          fede: data.fede || null,
        });
        showSuccessToast('Club créé avec succès');
        onSuccess(created);
      } catch {
        // Error handled by global handler
      } finally {
        onPendingChange?.(false);
      }
      return;
    }

    // Edit mode — check if longName changed and has references
    const longNameChanged = data.longName.trim() !== club!.longName.trim();

    if (longNameChanged) {
      const references = await clubsApi.getReferences(club!.id);
      if (references.raceCount > 0 || references.licenceCount > 0) {
        onPendingChange?.(false);
        setPropagateDialog({ references, formData: data });
        return;
      }
    }

    await saveClub(data, false);
  };

  const saveClub = async (data: FormValues, propagate: boolean) => {
    onPendingChange?.(true);
    try {
      await updateClub.mutateAsync({
        id: club!.id,
        updates: {
          shortName: data.shortName || undefined,
          longName: data.longName,
          elicenceName: data.elicenceName || undefined,
          dept: data.dept || undefined,
          propagate,
        },
      });
      showSuccessToast('Club mis à jour avec succès');
    } catch {
      // Error handled by global handler
    } finally {
      onPendingChange?.(false);
    }
  };

  const handlePropagate = async () => {
    if (!propagateDialog) return;
    setPropagateDialog(null);
    await saveClub(propagateDialog.formData, true);
  };

  const handleSkipPropagate = async () => {
    if (!propagateDialog) return;
    setPropagateDialog(null);
    await saveClub(propagateDialog.formData, false);
  };


  return (
    <>
      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-slate-100 dark:bg-muted/50 border-slate-200 dark:border-muted">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Informations du club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FieldSet>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StringField field="shortName" form={form} label="Nom court" />
                    <StringField field="longName" form={form} label="Nom long" required />
                  </div>
                  <StringField field="elicenceName" form={form} label="Nom eLicence" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StringField field="dept" form={form} label="Département" required />
                    {isCreating ? (
                      <SelectField
                        field="fede"
                        form={form}
                        label="Fédération"
                        options={FEDERATION_OPTIONS}
                        required
                      />
                    ) : (
                      <div className="text-sm flex items-center pt-7">
                        <span className="text-muted-foreground">Fédération :</span>{' '}
                        <span className="font-medium ml-1">{club?.fede || '—'}</span>
                      </div>
                    )}
                  </div>
                </FieldSet>
              </FieldGroup>
            </CardContent>
          </Card>

        </form>
      </Form>

      <Dialog open={!!propagateDialog} onOpenChange={open => { if (!open) setPropagateDialog(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Mettre à jour les références ?</DialogTitle>
            <DialogDescription>
              Le nom long du club a changé. Ce nom est utilisé dans{' '}
              <strong>{propagateDialog?.references.raceCount} participation(s)</strong> et{' '}
              <strong>{propagateDialog?.references.licenceCount} licence(s)</strong>.
              <br /><br />
              Souhaitez-vous mettre à jour ces références avec le nouveau nom ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setPropagateDialog(null)}>
              Annuler
            </Button>
            <Button variant="outline" onClick={handleSkipPropagate}>
              Non, modifier uniquement le club
            </Button>
            <Button onClick={handlePropagate}>
              Oui, mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
