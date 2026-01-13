import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Editor } from '@/components/blocks/editor-00/editor.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  CheckboxField,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
  StringField,
} from '@/components/ui/field.tsx';
import { Form } from '@/components/ui/form.tsx';
import { Separator } from '@/components/ui/separator.tsx';

import { MapPickerField } from './MapPickerField.tsx';

import type { SerializedEditorState } from 'lexical';

const categorySchema = z.object({
  name: z.string().min(1, 'Le nom de la catégorie est requis'),
  startTime: z.string().min(1, "L'heure de départ est requise"),
  registerTime: z.string().min(1, "L'heure d'enregistrement est requise"),
  gpx: z.string().url('Le lien GPX doit être une URL valide').or(z.literal('')),
  laps: z.number().min(0).optional().or(z.literal(undefined)),
  totalDistance: z.number().min(0, 'La distance totale doit être positive'),
});

const formSchema = z.object({
  name: z.string(),
  date: z.date(),
  type: z.string(),
  zipCode: z.string(),
  club: z.string(),
  federation: z.string(),
  categories: z.array(categorySchema).min(1, 'Au moins une catégorie est requise'),
  trail_distance: z.number().min(0),
  trail_profile: z.string(),
  contact_name: z.string(),
  contact_email: z.email(),
  contact_phone: z.string(),
  facebook_link: z.url().optional(),
  website_link: z.url().optional(),
  speaker: z.string().optional(),
  commissaires: z.string().optional(),
  podiumGPS: z
    .string()
    .optional()
    .refine(val => {
      if (!val) {
        return true;
      }
      const [lat, lng] = val.split(',').map(Number);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }, 'Coordonnées GPS invalides'),
});

export const RaceGeneralForm = () => {
  const [editorState, setEditorState] = useState<SerializedEditorState>();
  const raceForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: raceForm.control,
    name: 'categories',
  });

  const addCategory = () => {
    append({
      name: '',
      startTime: '',
      registerTime: '',
      gpx: '',
      laps: undefined,
      totalDistance: 0,
    });
  };

  return (
    <Form {...raceForm}>
      <form className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informations générales</FieldLegend>
            <FieldDescription>Informations de base sur l'épreuve</FieldDescription>
          </FieldSet>
          <FieldSet>
            <StringField form={raceForm} label="Nom de l'épreuve" field="name" />
            <StringField form={raceForm} label="Date" field="date" />
            <StringField form={raceForm} label="Federation" field="federation" />
            <StringField form={raceForm} label="Code postal" field="zipCode" />
            <StringField form={raceForm} label="Club organisateur" field="club" />
          </FieldSet>
        </FieldGroup>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informations contact</FieldLegend>
            <FieldDescription>Contact de l'épreuve pour les participants</FieldDescription>
          </FieldSet>
          <FieldSet>
            <StringField form={raceForm} label="Nom du contact" field="contact_name" />
            <StringField form={raceForm} label="Téléphone du contact" field="contact_phone" />
            <StringField
              form={raceForm}
              label="Email du contact"
              field="contact_email"
              type="email"
              autoComplete="email"
            />
          </FieldSet>
        </FieldGroup>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informations circuit</FieldLegend>
            <FieldDescription>Détails sur le circuit de l'épreuve</FieldDescription>
          </FieldSet>
          <FieldSet>
            <StringField form={raceForm} label="Type de course" field="type" />
            <StringField form={raceForm} label="Longueur circuit" field="trail_distance" />
            <StringField form={raceForm} label="Profile circuit" field="trail_profile" />
          </FieldSet>
        </FieldGroup>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informations complémentailres</FieldLegend>
            <FieldDescription>Détails sur le circuit de l'épreuve</FieldDescription>
          </FieldSet>
          <FieldSet>
            <StringField form={raceForm} label="Lien facebook" field="facebook_link" />
            <StringField form={raceForm} label="Lien site web" field="website_link" />
            <StringField form={raceForm} label="Speaker" field="speaker" />
            <StringField form={raceForm} label="Commissaires" field="commissaires" />
            <CheckboxField form={raceForm} label="Ouvert toutes fédés" field="contact_name" />
            <CheckboxField form={raceForm} label="Ouvert non licenciés" field="contact_name" />
            <CheckboxField form={raceForm} label="Chronométré" field="contact_name" />
          </FieldSet>
        </FieldGroup>
        <FieldGroup className="col-span-2">
          <FieldSet>
            <FieldLegend>Catégories</FieldLegend>
            <FieldDescription>Configurez les différentes catégories de la course</FieldDescription>
          </FieldSet>
          <FieldSet className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="relative rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Catégorie {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StringField
                    form={raceForm}
                    label="Nom de la catégorie"
                    field={`categories.${index}.name` as any}
                  />
                  <StringField
                    form={raceForm}
                    label="Heure de départ"
                    field={`categories.${index}.startTime` as any}
                    type="time"
                  />
                  <StringField
                    form={raceForm}
                    label="Heure d'enregistrement"
                    field={`categories.${index}.registerTime` as any}
                    type="time"
                  />
                  <StringField
                    form={raceForm}
                    label="Lien GPX"
                    field={`categories.${index}.gpx` as any}
                    type="url"
                  />
                  <StringField
                    form={raceForm}
                    label="Nombre de tours (optionnel)"
                    field={`categories.${index}.laps` as any}
                    type="number"
                  />
                  <StringField
                    form={raceForm}
                    label="Distance totale (km)"
                    field={`categories.${index}.totalDistance` as any}
                    type="number"
                  />
                </div>
                {index < fields.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addCategory} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une catégorie
            </Button>
          </FieldSet>
        </FieldGroup>
        <FieldGroup className="col-span-2">
          <FieldSet>
            <FieldLegend>Description</FieldLegend>
          </FieldSet>
          <FieldSet>
            <Editor
              editorSerializedState={editorState}
              onSerializedChange={value => setEditorState(value)}
            />
          </FieldSet>
        </FieldGroup>
        <FieldGroup className="col-span-2">
          <FieldSet>
            <FieldLegend>Emplacement Podium</FieldLegend>
            <FieldDescription>
              Cliquez sur la carte pour définir l'emplacement de la cérémonie des podiums
            </FieldDescription>
          </FieldSet>
          <FieldSet>
            <MapPickerField form={raceForm} label="Position GPS du podium" field="podiumGPS" />
          </FieldSet>
        </FieldGroup>
      </form>
    </Form>
  );
};
