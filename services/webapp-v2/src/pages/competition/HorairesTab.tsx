import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertTriangle, Copy, Edit2, ExternalLink, Route, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { DisabledReasonTooltip } from '@/components/common/DisabledReasonTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCompetitionInfoLabels } from '@/config/federations';
import type { CompetitionInfoItem } from '@/types/competitions';

import { GpxTracePreviewDialog } from './GpxTracePreviewDialog';
import { HoraireEntryForm } from './HoraireEntryForm';
import { SortableTableRow } from './SortableTableRow';
import type { FormValues } from './types';

type HorairesTabProps = {
  /** `undefined` tant que l'épreuve n'est pas enregistrée : pas encore de dépôt de GPX possible. */
  competitionId?: number;
  /** Dépôt d'un GPX en cours : ajouter ou enregistrer le circuit perdrait son tracé. */
  gpxUploading: boolean;
  onGpxUploadingChange: (uploading: boolean) => void;
  /** Enregistrement de l'épreuve en cours : les actions sur les circuits attendent. */
  isSaving: boolean;
  /**
   * Enregistre l'épreuve après l'ajout, la modification, la duplication, la
   * suppression ou le déplacement d'un circuit : le bouton « Enregistrer » de la toolbar est
   * souvent oublié. Absent en création ou quand l'épreuve ne peut pas être
   * enregistrée (champs obligatoires, GPX en cours de calcul).
   */
  onSaveCompetition?: () => void;
};

export function HorairesTab({
  competitionId,
  gpxUploading,
  onGpxUploadingChange,
  isSaving,
  onSaveCompetition,
}: HorairesTabProps) {
  const form = useFormContext<FormValues>();
  const fede = form.watch('fede');
  const competitionType = form.watch('competitionType');
  const infoLabels = getCompetitionInfoLabels(fede, competitionType);
  const { info1Label, info2Label } = infoLabels;

  const [horaireForm, setHoraireForm] = useState<CompetitionInfoItem>({
    course: '',
    horaireEngagement: '',
    horaireDepart: '',
    info1: '',
    info2: '',
    info3: '',
  });
  const [editingHoraireIndex, setEditingHoraireIndex] = useState<number | null>(null);
  // Dernier tracé ouvert, gardé à la fermeture (cf. GpxTracePreviewDialog).
  const [previewGpxTraceId, setPreviewGpxTraceId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    fields: competitionInfoFields,
    append: appendCompetitionInfo,
    remove: removeCompetitionInfo,
    update: updateCompetitionInfo,
    move: moveCompetitionInfo,
  } = useFieldArray({
    control: form.control,
    name: 'competitionInfo',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Pendant une modification, la ligne éditée est repérée par sa position :
  // supprimer, dupliquer ou déplacer une ligne la décalerait.
  const rowActionsLockedReason = isSaving
    ? "Enregistrement de l'épreuve en cours…"
    : editingHoraireIndex !== null
      ? 'Terminez ou annulez la modification en cours'
      : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = competitionInfoFields.findIndex(f => f.id === active.id);
      const newIndex = competitionInfoFields.findIndex(f => f.id === over.id);
      moveCompetitionInfo(oldIndex, newIndex);
      onSaveCompetition?.();
    }
  };

  const handleAddHoraire = () => {
    if (editingHoraireIndex !== null) {
      updateCompetitionInfo(editingHoraireIndex, horaireForm);
      setEditingHoraireIndex(null);
    } else {
      appendCompetitionInfo(horaireForm);
    }
    onSaveCompetition?.();
    setHoraireForm({
      course: '',
      horaireEngagement: '',
      horaireDepart: '',
      info1: '',
      info2: '',
      info3: '',
    });
  };

  const handleEditHoraire = (index: number) => {
    const circuit = competitionInfoFields[index] as CompetitionInfoItem;
    // Un circuit a soit un lien, soit un GPX : le GPX l'emporte.
    setHoraireForm(circuit.gpxTraceId ? { ...circuit, info3: '' } : circuit);
    setEditingHoraireIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingHoraireIndex(null);
    setHoraireForm({
      course: '',
      horaireEngagement: '',
      horaireDepart: '',
      info1: '',
      info2: '',
      info3: '',
    });
  };

  return (
    <Card className="rounded-t-none border-t-0">
      <CardHeader className="pt-4">
        <CardTitle>
          <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
            Horaires & Circuit
          </span>
        </CardTitle>
        <CardDescription>
          Définissez les différents départs et leurs horaires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <HoraireEntryForm
          value={horaireForm}
          onChange={setHoraireForm}
          isEditing={editingHoraireIndex !== null}
          onSubmit={handleAddHoraire}
          onCancel={handleCancelEdit}
          infoLabels={infoLabels}
          competitionId={competitionId}
          gpxUploading={gpxUploading}
          isSaving={isSaving}
          onGpxUploadingChange={onGpxUploadingChange}
        />

        {competitionInfoFields.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[600px] table-fixed [&_td]:whitespace-normal [&_td]:md:whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[140px]">Catégorie</TableHead>
                    <TableHead className="w-[100px]">Dossard</TableHead>
                    <TableHead className="w-[80px]">Départ</TableHead>
                    <TableHead className="w-[60px]">{info1Label}</TableHead>
                    <TableHead className="w-[80px]">{info2Label}</TableHead>
                    <TableHead className="w-[50px]">Parcours</TableHead>
                    <TableHead className="w-[90px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={competitionInfoFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {competitionInfoFields.map((field, index) => (
                      <SortableTableRow
                        key={field.id}
                        id={field.id}
                        disabled={!!rowActionsLockedReason}
                      >
                        <TableCell>{(field as CompetitionInfoItem).course}</TableCell>
                        <TableCell>
                          {(field as CompetitionInfoItem).horaireEngagement}
                        </TableCell>
                        <TableCell>{(field as CompetitionInfoItem).horaireDepart}</TableCell>
                        <TableCell>{(field as CompetitionInfoItem).info1}</TableCell>
                        <TableCell>{(field as CompetitionInfoItem).info2}</TableCell>
                        <TableCell>
                          {(field as CompetitionInfoItem).gpxTraceId ? (
                            <button
                              type="button"
                              title="Aperçu du GPX déposé"
                              aria-label="Aperçu du GPX déposé"
                              onClick={() => {
                                setPreviewGpxTraceId((field as CompetitionInfoItem).gpxTraceId!);
                                setPreviewOpen(true);
                              }}
                              className="inline-flex text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              <Route className="h-4 w-4" />
                            </button>
                          ) : (
                            (field as CompetitionInfoItem).info3 && (
                              <a
                                href={(field as CompetitionInfoItem).info3}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditHoraire(index)}
                              disabled={isSaving}
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <DisabledReasonTooltip reason={rowActionsLockedReason}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const item = competitionInfoFields[index] as CompetitionInfoItem;
                                  appendCompetitionInfo({ ...item });
                                  onSaveCompetition?.();
                                }}
                                disabled={!!rowActionsLockedReason}
                                title="Dupliquer"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </DisabledReasonTooltip>
                            <DisabledReasonTooltip reason={rowActionsLockedReason}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  removeCompetitionInfo(index);
                                  onSaveCompetition?.();
                                }}
                                disabled={!!rowActionsLockedReason}
                                title="Supprimer"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DisabledReasonTooltip>
                          </div>
                        </TableCell>
                      </SortableTableRow>
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </div>
          </DndContext>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Aucun horaire ou parcours encore ajouté
          </p>
        )}

        {/* Pas d'enregistrement automatique (épreuve pas encore créée, champs
            obligatoires manquants, GPX en cours de calcul) : on le rappelle. */}
        {!onSaveCompetition && competitionInfoFields.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <strong>N'oubliez pas d'enregistrer l'épreuve !</strong>
          </div>
        )}
        {competitionId != null && (
          <GpxTracePreviewDialog
            competitionId={competitionId}
            open={previewOpen}
            gpxTraceId={previewGpxTraceId}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
