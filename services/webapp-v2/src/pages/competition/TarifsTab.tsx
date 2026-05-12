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
import { useState } from 'react';
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

import { parseTarifAmount, tarifToDisplay, tarifToInput } from './pricing-utils';
import { SortableTableRow } from './SortableTableRow';

import type { FormValues } from './types';

export function TarifsTab() {
  const form = useFormContext<FormValues>();
  const onlinePayment = form.watch('onlineRegistrationEnabled') ?? false;

  // Saisie locale toujours en string pour préserver les séparateurs ("12,5" en cours
  // de frappe). À l'add/save : si paiement en ligne ON, on parse en number ; sinon
  // on garde la string libre telle quelle.
  const [pricingForm, setPricingForm] = useState<{ name: string; tarif: string }>({
    name: '',
    tarif: '',
  });
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

  const resetForm = () => {
    setPricingForm({ name: '', tarif: '' });
    setEditingPricingIndex(null);
  };

  const handleAddPricing = () => {
    if (!pricingForm.name) {return;}

    // Si paiement en ligne ON et la saisie parse en number → on stocke en number.
    // Sinon (paiement OFF, ou saisie non numérique) → on stocke en string telle quelle.
    // La validation zod surfacera l'erreur si online ON + tarif non numérique.
    let tarifValue: string | number = pricingForm.tarif;
    if (onlinePayment) {
      const parsed = parseTarifAmount(pricingForm.tarif);
      if (parsed != null) {tarifValue = parsed;}
    }

    const item: PricingItem = { name: pricingForm.name, tarif: tarifValue };

    if (editingPricingIndex !== null) {
      updatePricing(editingPricingIndex, item);
    } else {
      appendPricing(item);
    }
    resetForm();
  };

  const handleEditPricing = (index: number) => {
    const item = pricingFields[index] as unknown as PricingItem;
    setPricingForm({
      name: item.name || '',
      tarif: tarifToInput(item.tarif),
    });
    setEditingPricingIndex(index);
  };

  /** Suffixe ` (copie)` (puis `(copie 2)`, etc.) jusqu'à trouver un nom libre.
   *  Le `name` est la clé de lookup quand paiement en ligne ON — on garantit
   *  l'unicité dès la duplication pour ne pas faire échouer la validation. */
  const nextCopyName = (baseName: string): string => {
    const existing = new Set(
      pricingFields.map(f => (f as unknown as PricingItem).name),
    );
    const candidate = `${baseName} (copie)`;
    if (!existing.has(candidate)) {return candidate;}
    let n = 2;
    while (existing.has(`${baseName} (copie ${n})`)) {n++;}
    return `${baseName} (copie ${n})`;
  };

  const handleDuplicate = (item: PricingItem) => {
    appendPricing({ ...item, name: nextCopyName(item.name) });
  };

  return (
    <Card className="rounded-t-none border-t-0">
      <CardHeader className="pt-4">
        <CardTitle>
          <span className="text-emerald-700 dark:text-white relative pb-1 inline-block after:absolute after:bottom-0 after:left-0 after:-right-2 after:h-px after:bg-emerald-700/30 dark:after:bg-white/30 after:rounded-full">
            Tarifs
          </span>
        </CardTitle>
        <CardDescription>
          Définissez les différents tarifs d&apos;inscription
          {onlinePayment && (
            <span className="ml-1">
              — <strong>Paiement en ligne activé</strong> : le montant doit être un nombre
              (ex: <code>8</code>, <code>12,50</code>)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1.5">
            <Label>Nom du tarif</Label>
            <Input
              value={pricingForm.name}
              onChange={e => setPricingForm({ ...pricingForm, name: e.target.value })}
              placeholder="ex: Licencié FFC"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Montant</Label>
            <Input
              inputMode={onlinePayment ? 'decimal' : 'text'}
              value={pricingForm.tarif}
              onChange={e => setPricingForm({ ...pricingForm, tarif: e.target.value })}
              placeholder={onlinePayment ? 'ex: 7,50' : 'ex: 7 € (10 € sur place)'}
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
              <Button type="button" variant="outline" onClick={resetForm}>
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
                    <TableHead className="w-[40px]" />
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
                    {pricingFields.map((field, index) => {
                      const item = field as unknown as PricingItem;
                      const invalid = onlinePayment && parseTarifAmount(item.tarif) == null;
                      return (
                        <SortableTableRow key={field.id} id={field.id}>
                          <TableCell className="whitespace-nowrap">{item.name}</TableCell>
                          <TableCell
                            className={`whitespace-nowrap ${invalid ? 'text-destructive' : ''}`}
                          >
                            {invalid ? 'à corriger en chiffres' : tarifToDisplay(item.tarif)}
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
                                onClick={() => handleDuplicate(item)}
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
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </Table>
            </div>
          </DndContext>
        ) : (
          <p className="text-muted-foreground text-center py-8">Aucun tarif encore ajouté</p>
        )}

        {pricingFields.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            <strong>N&apos;oubliez pas de sauvegarder l&apos;épreuve !</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
