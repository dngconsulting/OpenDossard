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
import { Copy, Edit2, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CompetitionInfoItem } from '@/types/competitions';

import { SortableTableRow } from './SortableTableRow';
import type { FormValues } from './types';

export function HorairesTab() {
  const form = useFormContext<FormValues>();

  const [horaireForm, setHoraireForm] = useState<CompetitionInfoItem>({
    course: '',
    horaireEngagement: '',
    horaireDepart: '',
    info1: '',
    info2: '',
    info3: '',
  });
  const [editingHoraireIndex, setEditingHoraireIndex] = useState<number | null>(null);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = competitionInfoFields.findIndex(f => f.id === active.id);
      const newIndex = competitionInfoFields.findIndex(f => f.id === over.id);
      moveCompetitionInfo(oldIndex, newIndex);
    }
  };

  const handleAddHoraire = () => {
    if (!horaireForm.course || !horaireForm.horaireDepart) {
      return;
    }

    if (editingHoraireIndex !== null) {
      updateCompetitionInfo(editingHoraireIndex, horaireForm);
      setEditingHoraireIndex(null);
    } else {
      appendCompetitionInfo(horaireForm);
    }
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
    setHoraireForm(competitionInfoFields[index] as CompetitionInfoItem);
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1.5">
            <Label>Catégorie/Départ</Label>
            <Input
              value={horaireForm.course}
              onChange={e => setHoraireForm({ ...horaireForm, course: e.target.value })}
              placeholder="ex: Cat 4"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Heure dossard</Label>
            <Input
              value={horaireForm.horaireEngagement}
              onChange={e =>
                setHoraireForm({ ...horaireForm, horaireEngagement: e.target.value })
              }
              placeholder="ex: 14h"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Heure départ</Label>
            <Input
              value={horaireForm.horaireDepart}
              onChange={e =>
                setHoraireForm({ ...horaireForm, horaireDepart: e.target.value })
              }
              placeholder="ex: 15h"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tours</Label>
            <Input
              value={horaireForm.info1}
              onChange={e => setHoraireForm({ ...horaireForm, info1: e.target.value })}
              placeholder="ex: 10"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Distance</Label>
            <Input
              value={horaireForm.info2}
              onChange={e => setHoraireForm({ ...horaireForm, info2: e.target.value })}
              placeholder="ex: 58kms"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lien OpenRunner</Label>
            <Input
              value={horaireForm.info3 || ''}
              onChange={e => setHoraireForm({ ...horaireForm, info3: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            onClick={handleAddHoraire}
          >
            {editingHoraireIndex !== null ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingHoraireIndex !== null ? 'Enregistrer' : 'Ajouter'}
          </Button>
          {editingHoraireIndex !== null && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
            >
              Annuler
            </Button>
          )}
        </div>

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
                    <TableHead className="w-[60px]">Tours</TableHead>
                    <TableHead className="w-[80px]">Distance</TableHead>
                    <TableHead className="w-[50px]">Lien</TableHead>
                    <TableHead className="w-[90px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={competitionInfoFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {competitionInfoFields.map((field, index) => (
                      <SortableTableRow key={field.id} id={field.id}>
                        <TableCell>{(field as CompetitionInfoItem).course}</TableCell>
                        <TableCell>
                          {(field as CompetitionInfoItem).horaireEngagement}
                        </TableCell>
                        <TableCell>{(field as CompetitionInfoItem).horaireDepart}</TableCell>
                        <TableCell>{(field as CompetitionInfoItem).info1}</TableCell>
                        <TableCell>{(field as CompetitionInfoItem).info2}</TableCell>
                        <TableCell>
                          {(field as CompetitionInfoItem).info3 && (
                            <a
                              href={(field as CompetitionInfoItem).info3}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditHoraire(index)}
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const item = competitionInfoFields[index] as CompetitionInfoItem;
                                appendCompetitionInfo({ ...item });
                              }}
                              title="Dupliquer"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCompetitionInfo(index)}
                              title="Supprimer"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {competitionInfoFields.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            <strong>N'oubliez pas de sauvegarder l'épreuve !</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
