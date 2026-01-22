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
import { Copy, Edit2, Plus, Save, Trash2 } from 'lucide-react';
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
import type { PricingItem } from '@/types/competitions';

import { SortableTableRow } from './SortableTableRow';
import type { FormValues } from './types';

export function TarifsTab() {
  const form = useFormContext<FormValues>();

  const [pricingForm, setPricingForm] = useState<PricingItem>({ name: '', tarif: '' });
  const [editingPricingIndex, setEditingPricingIndex] = useState<number | null>(null);

  const {
    fields: pricingFields,
    append: appendPricing,
    remove: removePricing,
    update: updatePricing,
    move: movePricing,
  } = useFieldArray({
    control: form.control,
    name: 'pricing',
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
      const oldIndex = pricingFields.findIndex(f => f.id === active.id);
      const newIndex = pricingFields.findIndex(f => f.id === over.id);
      movePricing(oldIndex, newIndex);
    }
  };

  const handleAddPricing = () => {
    if (!pricingForm.name) {
      return;
    }

    const cleanedPricing = {
      ...pricingForm,
      tarif: (pricingForm.tarif || '').replace(/[€\s]+/g, '').trim(),
    };

    if (editingPricingIndex !== null) {
      updatePricing(editingPricingIndex, cleanedPricing);
      setEditingPricingIndex(null);
    } else {
      appendPricing(cleanedPricing);
    }
    setPricingForm({ name: '', tarif: '' });
  };

  const handleEditPricing = (index: number) => {
    const item = pricingFields[index] as PricingItem;
    const rawTarif = item.tarif || '';
    // Remove non-numeric chars except dots and commas, then convert comma to dot for number input
    const cleanedTarif = rawTarif.replace(/[^0-9.,]/g, '').replace(',', '.').trim();
    setPricingForm({
      name: item.name || '',
      tarif: cleanedTarif,
    });
    setEditingPricingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingPricingIndex(null);
    setPricingForm({ name: '', tarif: '' });
  };

  return (
    <Card className="rounded-t-none border-t-0">
      <CardHeader>
        <CardTitle>Tarifs</CardTitle>
        <CardDescription>Definissez les differents tarifs d'inscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1.5">
            <Label>Nom du tarif</Label>
            <Input
              value={pricingForm.name}
              onChange={e => setPricingForm({ ...pricingForm, name: e.target.value })}
              placeholder="ex: Licencie FFC"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Montant (euro)</Label>
            <Input
              type="number"
              value={pricingForm.tarif}
              onChange={e => setPricingForm({ ...pricingForm, tarif: e.target.value })}
              placeholder="ex: 7"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="default" onClick={handleAddPricing}>
              {editingPricingIndex !== null ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingPricingIndex !== null ? 'Enregistrer' : 'Ajouter'}
            </Button>
            {editingPricingIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>

        {pricingFields.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Tarif</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="w-[130px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={pricingFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {pricingFields.map((field, index) => (
                      <SortableTableRow key={field.id} id={field.id}>
                        <TableCell className="whitespace-nowrap">
                          {(field as PricingItem).name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {((field as PricingItem).tarif || '').replace(/[€\s]+/g, '').trim()} €
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPricing(index)}
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const item = pricingFields[index] as PricingItem;
                                appendPricing({ ...item });
                              }}
                              title="Dupliquer"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePricing(index)}
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
            Aucun tarif encore ajouté
          </p>
        )}

        {pricingFields.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            <strong>N'oubliez pas de sauvegarder l'épreuve !</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
