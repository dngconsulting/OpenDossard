import { Plus, Save } from 'lucide-react';

import { DisabledReasonTooltip } from '@/components/common/DisabledReasonTooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { getCompetitionInfoLabels } from '@/config/federations';
import type { CompetitionInfoItem } from '@/types/competitions';

import { CircuitGpxField } from './CircuitGpxField';
import { FieldHelp } from './FieldHelp';

import type { Dispatch, SetStateAction } from 'react';

type HoraireEntryFormProps = {
  value: CompetitionInfoItem;
  /** Setter d'état : le dépôt GPX asynchrone a besoin d'une mise à jour fonctionnelle. */
  onChange: Dispatch<SetStateAction<CompetitionInfoItem>>;
  isEditing: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  infoLabels: ReturnType<typeof getCompetitionInfoLabels>;
  competitionId?: number;
  gpxUploading: boolean;
  isSaving: boolean;
  onGpxUploadingChange: (uploading: boolean) => void;
};

/** Saisie d'un départ (ajout ou modification) de l'onglet Horaires & Circuits. */
export function HoraireEntryForm({
  value,
  onChange,
  isEditing,
  onSubmit,
  onCancel,
  infoLabels,
  competitionId,
  gpxUploading,
  isSaving,
  onGpxUploadingChange,
}: HoraireEntryFormProps) {
  // Champs obligatoires : catégorie/départ et heure de départ (d'anciens circuits peuvent être null).
  const canSubmit = Boolean(value.course?.trim() && value.horaireDepart?.trim());

  const disabledReason = gpxUploading
    ? 'Calcul du profil du GPX en cours…'
    : isSaving
      ? "Enregistrement de l'épreuve en cours…"
      : !canSubmit
      ? "Renseignez la catégorie/départ et l'heure de départ"
      : null;

  return (
    <>
      {/* 1re ligne : les 5 champs courts ; 2e ligne : lien externe OU fichier GPX, côte à côte. */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-1.5 md:col-span-2">
          <Label>
            Catégorie/Départ <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.course}
            onChange={e => onChange({ ...value, course: e.target.value })}
            placeholder="ex: Cat 4"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Heure dossard</Label>
          <Input
            value={value.horaireEngagement}
            onChange={e =>
              onChange({ ...value, horaireEngagement: e.target.value })
            }
            placeholder="ex: 14h"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>
            Heure départ <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.horaireDepart}
            onChange={e =>
              onChange({ ...value, horaireDepart: e.target.value })
            }
            placeholder="ex: 15h"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>{infoLabels.info1Label}</Label>
          <Input
            value={value.info1}
            onChange={e => onChange({ ...value, info1: e.target.value })}
            placeholder={infoLabels.info1Placeholder}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>{infoLabels.info2Label}</Label>
          <Input
            value={value.info2}
            onChange={e => onChange({ ...value, info2: e.target.value })}
            placeholder={infoLabels.info2Placeholder}
          />
        </div>
        {/* Parcours : lien externe OU fichier GPX, jamais les deux (refusé par l'API). */}
        <fieldset className="md:col-span-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start gap-4 rounded-md border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">
            Parcours du circuit
          </legend>
          <div className="space-y-1.5">
            <Label>
              Lien externe du parcours
              <FieldHelp>
                Lien externe ouvert avec une application tierce (OpenRunner, VisuGPX, gpx-studio…)
              </FieldHelp>
            </Label>
            <Input
              value={value.info3 || ''}
              onChange={e => onChange({ ...value, info3: e.target.value })}
              placeholder="ex: https://www.openrunner.com/route-details/12345678"
              disabled={!!value.gpxTraceId}
            />
            {value.gpxTraceId && (
              <p className="text-xs text-muted-foreground">Retirez le GPX pour saisir un lien.</p>
            )}
          </div>
          {/* Même structure que les champs (libellé invisible + hauteur d'un champ) :
              le « OU » reste aligné sur les champs, quelle que soit la hauteur du contenu. */}
          <div className="space-y-1.5">
            <Label aria-hidden className="hidden md:flex md:invisible">
              OU
            </Label>
            <div className="flex h-9 items-center justify-center">
              <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                OU
              </span>
            </div>
          </div>
          <div>
            <CircuitGpxField
              competitionId={competitionId}
              gpxTraceId={value.gpxTraceId}
              uploading={gpxUploading}
              onUploadingChange={onGpxUploadingChange}
              hasLink={!!value.info3?.trim()}
              // Dépôt asynchrone (calcul ~15 s) : mise à jour fonctionnelle pour
              // ne pas écraser ce qui a été saisi entre-temps. Un GPX remplace le lien.
              onChange={gpxTraceId =>
                onChange(previous => ({
                  ...previous,
                  gpxTraceId,
                  ...(gpxTraceId ? { info3: '' } : {}),
                }))
              }
            />
          </div>
        </fieldset>
      </div>
      <div className="flex gap-2">
        <DisabledReasonTooltip reason={disabledReason}>
          <Button type="button" variant="default" onClick={onSubmit} disabled={!!disabledReason}>
            {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEditing ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DisabledReasonTooltip>
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Annuler
          </Button>
        )}
      </div>
    </>
  );
}
