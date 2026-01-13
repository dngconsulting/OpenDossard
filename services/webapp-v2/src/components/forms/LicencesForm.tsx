import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button.tsx';
import {
  ComboboxField,
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
import { useClubsByDepartment, useCreateClub } from '@/hooks/useClubs.ts';
import { useDepartments } from '@/hooks/useDepartments.ts';
import type { LicenceType } from '@/types/licences.ts';
import { computeAgeCategory } from '@/utils/licence.ts';

type Props = {
  updatingLicence?: LicenceType;
};

const formSchema = z.object({
  licenceNumber: z.string(),
  name: z.string(),
  firstName: z.string(),
  club: z.string(),
  gender: z.string(),
  dept: z.string(),
  birthYear: z.string(),
  catea: z.string(),
  catev: z.string(),
  catevCX: z.string(),
  fede: z.string(),
  saison: z.string(),
});

export const LicencesForm = ({ updatingLicence }: Props) => {
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();
  const createClub = useCreateClub();

  const licenceForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...updatingLicence, licenceNumber: updatingLicence?.licenceNumber ?? 'NC' },
  });

  const gender = licenceForm.watch('gender');
  const birthYear = licenceForm.watch('birthYear');
  const saison = licenceForm.watch('saison');
  const selectedDepartment = licenceForm.watch('dept');

  const { data: clubs, isLoading: isLoadingClubs } = useClubsByDepartment(selectedDepartment);

  const departmentOptions = useMemo(
    () =>
      departments?.map(dept => ({ value: dept.code, label: `${dept.code} - ${dept.name}` })) ?? [],
    [departments]
  );

  const clubOptions = useMemo(
    () => clubs?.map(club => ({ value: club.id, label: club.name })) ?? [],
    [clubs]
  );

  const handleCreateClub = async (name: string) => {
    const newClub = await createClub.mutateAsync({ name, department: selectedDepartment });
    licenceForm.setValue('club', newClub.id);
  };

  // Reset club when department changes
  useEffect(() => {
    if (!updatingLicence) {
      licenceForm.setValue('club', '');
    }
  }, [selectedDepartment, updatingLicence, licenceForm]);

  useEffect(() => {
    const forceUpdate: boolean = !!gender && !!birthYear && !!saison;
    if (forceUpdate) {
      const newAgeCategory = computeAgeCategory(gender, parseInt(birthYear, 10), saison);
      licenceForm.setValue('catea', newAgeCategory);
    }
  }, [gender, birthYear, saison, updatingLicence?.catea, licenceForm]);

  return (
    <Form {...licenceForm}>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informations personnelles</FieldLegend>
            <FieldDescription>Informations sur le licencié</FieldDescription>
          </FieldSet>
          <FieldSet>
            <StringField field="name" form={licenceForm} label="Nom" />
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
              field="fede"
              label="Fédération"
              options={[{ value: 'FSGT' }, { value: 'FFC' }, { value: 'UFOLEP' }, { value: 'FFTRI' }, { value: 'FFVELO' }, { value: 'FFCYCLISME' }, { value: 'NL' }]}
            />
            <StringField field="licenceNumber" form={licenceForm} label="Numéro de licence" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                form={licenceForm}
                field="saison"
                label="Saison"
                options={[{ value: '2024' }, { value: '2025' }]}
              />
              <ComboboxField
                form={licenceForm}
                field="dept"
                label="Département"
                options={departmentOptions}
                isLoading={isLoadingDepartments}
              />
              <StringField field="catea" form={licenceForm} label="Catégorie d'âge" />
              <SelectField
                form={licenceForm}
                field="catev"
                label="Catégorie"
                options={[{ value: '1' }, { value: '2' }]}
              />
              <SelectField
                form={licenceForm}
                field="catevCX"
                label="Catégorie CX"
                options={[{ value: '1' }, { value: '2' }]}
              />
              <ComboboxField
                form={licenceForm}
                field="club"
                label="Club"
                options={clubOptions}
                onCreateNew={handleCreateClub}
                placeholder="Rechercher..."
                isLoading={isLoadingClubs}
                disabled={!selectedDepartment}
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
