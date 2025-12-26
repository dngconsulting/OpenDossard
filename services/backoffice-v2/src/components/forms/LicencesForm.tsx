import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button.tsx';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  SelectField,
  StringField,
} from '@/components/ui/field.tsx';
import { Form } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import type { LicenceType } from '@/types/licences.ts';
import { computeAgeCategory } from '@/utils/licence.ts';

type Props = {
  updatingLicence?: LicenceType;
};

const formSchema = z.object({
  licenceNumber: z.string(),
  lastName: z.string(),
  firstName: z.string(),
  club: z.string(),
  gender: z.string(),
  state: z.string(),
  birthYear: z.number().max(2020).min(1900),
  ageCategory: z.string(),
  category: z.string(),
  cxCategory: z.string(),
  federation: z.string(),
  season: z.string(),
});

export const LicencesForm = ({ updatingLicence }: Props) => {
  const licenceForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...updatingLicence, licenceNumber: updatingLicence?.licenceNumber ?? 'NC' },
  });

  const gender = licenceForm.watch('gender');
  const birthYear = licenceForm.watch('birthYear');
  const season = licenceForm.watch('season');

  useEffect(() => {
    const forceUpdate: boolean = !!gender && !!birthYear && !!season;
    if (forceUpdate) {
      const newAgeCategory = computeAgeCategory(gender, birthYear, season);
      licenceForm.setValue('ageCategory', newAgeCategory);
    }
  }, [gender, birthYear, season, updatingLicence?.ageCategory, licenceForm]);

  return (
    <Form {...licenceForm}>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informations personnelles</FieldLegend>
            <FieldDescription>Informations sur le licencié</FieldDescription>
          </FieldSet>
          <FieldSet>
            <StringField field="lastName" form={licenceForm} label="Nom" />
            <StringField field="firstName" form={licenceForm} label="Prénom" />
            <div className="grid grid-cols-2 gap-4">
              <StringField field="birthYear" form={licenceForm} label="Année de naissance" />
              <SelectField
                form={licenceForm}
                field="gender"
                label="Genre"
                options={[{ value: 'H' }, { value: 'F' }]}
              />
            </div>
          </FieldSet>
        </FieldGroup>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Licence</FieldLegend>
            <FieldDescription>Informations sur la licence</FieldDescription>
          </FieldSet>
          <FieldSet>
            <SelectField
              form={licenceForm}
              field="federation"
              label="Fédération"
              options={[{ value: 'FSGT' }, { value: 'FFC' }, { value: 'UFOLEP' }]}
            />
            <StringField field="licenceNumber" form={licenceForm} label="Numéro de licence" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                form={licenceForm}
                field="season"
                label="Saison"
                options={[{ value: '2024' }, { value: '2025' }]}
              />
              <SelectField
                form={licenceForm}
                field="state"
                label="Département"
                options={[{ value: '44' }, { value: '31' }]}
              />
              <StringField field="ageCategory" form={licenceForm} label="Catégorie d'âge" />
              <SelectField
                form={licenceForm}
                field="category"
                label="Catégorie"
                options={[{ value: '1' }, { value: '2' }]}
              />
              <SelectField
                form={licenceForm}
                field="cxCategory"
                label="Catégorie CX"
                options={[{ value: '1' }, { value: '2' }]}
              />
            </div>
            <Field>
              <FieldLabel htmlFor="comments">Commentaires</FieldLabel>
              <Textarea
                id="comments"
                placeholder="Ajouter des commentaires additionnels"
                className="resize-none"
              />
            </Field>
          </FieldSet>
          <Field orientation="horizontal" className="justify-end">
            <Button type="submit">Enregistrer</Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
};
