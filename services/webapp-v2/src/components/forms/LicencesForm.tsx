import { zodResolver } from '@hookform/resolvers/zod';
import { Award, Info, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { ClubAutocomplete } from '@/components/ClubAutocomplete';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {
  ComboboxField,
  Field,
  FieldDescription,
  FieldLabel,
  SelectField,
  StringField,
} from '@/components/ui/field.tsx';
import { Form } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import {
  FEDERATION_OPTIONS,
  FIELD_HELPER_TEXTS,
  getCateaOptions,
  getCatevCXOptions,
  getCatevOptions,
  isNonLicencie,
} from '@/config/federations';
import { useDepartments } from '@/hooks/useDepartments.ts';
import { useCreateLicence, useUpdateLicence } from '@/hooks/useLicences';
import type { LicenceType } from '@/types/licences.ts';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';
import { computeAgeCategory } from '@/utils/licence.ts';

type Props = {
  updatingLicence?: LicenceType;
};

const currentYear = new Date().getFullYear();

const formSchema = z.object({
  licenceNumber: z.string().optional(),
  name: z.string().min(1, 'Le nom est requis'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  club: z.string().optional(),
  gender: z.enum(['H', 'F'], { message: 'Le genre est requis' }),
  dept: z.string().min(1, 'Le département est requis'),
  birthYear: z
    .string()
    .min(4, "L'année de naissance est requise")
    .refine(
      val => {
        const year = parseInt(val, 10);
        const age = currentYear - year;
        return age >= 4 && age <= 130;
      },
      { message: `L'année doit être entre ${currentYear - 130} et ${currentYear - 4}` }
    ),
  catea: z.string().min(1, "La catégorie d'âge est requise"),
  catev: z.string().min(1, 'La catégorie de valeur est requise'),
  catevCX: z.string().optional(),
  fede: z.string().min(1, 'La fédération est requise'),
  saison: z.string().min(1, 'La saison est requise'),
  comment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const LicencesForm = ({ updatingLicence }: Props) => {
  const navigate = useNavigate();
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();
  const createLicence = useCreateLicence();
  const updateLicence = useUpdateLicence();

  const isEditing = !!updatingLicence?.id;
  const isSaving = createLicence.isPending || updateLicence.isPending;

  const licenceForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      licenceNumber: updatingLicence?.licenceNumber ?? '',
      name: updatingLicence?.name ?? '',
      firstName: updatingLicence?.firstName ?? '',
      club: updatingLicence?.club ?? '',
      gender: (updatingLicence?.gender as 'H' | 'F') ?? undefined,
      dept: updatingLicence?.dept ?? '',
      birthYear: updatingLicence?.birthYear ?? '',
      catea: updatingLicence?.catea ?? '',
      catev: updatingLicence?.catev ?? '',
      catevCX: updatingLicence?.catevCX ?? '',
      fede: updatingLicence?.fede ?? '',
      saison: updatingLicence?.saison ?? currentYear.toString(),
      comment: updatingLicence?.comment ?? '',
    },
  });

  const fede = licenceForm.watch('fede');
  const gender = licenceForm.watch('gender');
  const birthYear = licenceForm.watch('birthYear');
  const saison = licenceForm.watch('saison');
  const selectedDepartment = licenceForm.watch('dept');

  const isNL = isNonLicencie(fede);

  const departmentOptions = useMemo(
    () =>
      departments?.map(dept => ({ value: dept.code, label: `${dept.code} - ${dept.name}` })) ?? [],
    [departments]
  );

  // Options de catégories basées sur la fédération et le genre
  const cateaOptions = useMemo(() => {
    if (!fede || !gender) return [];
    return getCateaOptions(fede, gender);
  }, [fede, gender]);

  const catevOptions = useMemo(() => {
    if (!fede) return [];
    return getCatevOptions(fede, 'ROUTE');
  }, [fede]);

  const catevCXOptions = useMemo(() => {
    if (!fede) return [];
    return getCatevCXOptions(fede);
  }, [fede]);

  // Helper text dynamique pour le prénom selon la fédération
  const firstNameHelperText = useMemo(() => {
    if (fede === 'FSGT') return FIELD_HELPER_TEXTS.firstName.FSGT;
    return FIELD_HELPER_TEXTS.firstName.default;
  }, [fede]);

  // Helper text dynamique pour le club selon la fédération
  const clubHelperText = useMemo(() => {
    if (fede === 'UFOLEP' || fede === 'FFC') return FIELD_HELPER_TEXTS.club.UFOLEP;
    return FIELD_HELPER_TEXTS.club.default;
  }, [fede]);

  // Reset club quand le département change
  const previousDeptRef = useRef(selectedDepartment);
  useEffect(() => {
    if (previousDeptRef.current !== selectedDepartment && previousDeptRef.current !== undefined) {
      licenceForm.setValue('club', '');
    }
    previousDeptRef.current = selectedDepartment;
  }, [selectedDepartment, licenceForm]);

  // Reset catev, catevCX, dept, club quand la fédération change
  const previousFedeRef = useRef(fede);
  useEffect(() => {
    if (previousFedeRef.current !== fede && previousFedeRef.current !== undefined) {
      licenceForm.setValue('catev', '');
      licenceForm.setValue('catevCX', '');
      licenceForm.setValue('dept', '');
      licenceForm.setValue('club', '');
    }
    previousFedeRef.current = fede;
  }, [fede, licenceForm]);

  // Reset catea quand le genre change
  useEffect(() => {
    if (gender && !updatingLicence) {
      licenceForm.setValue('catea', '');
      licenceForm.setValue('catev', '');
      licenceForm.setValue('catevCX', '');
    }
  }, [gender, updatingLicence, licenceForm]);

  // Auto-calcul de la catégorie d'âge
  useEffect(() => {
    if (gender && birthYear && birthYear.length === 4 && saison) {
      const newCatea = computeAgeCategory(gender, parseInt(birthYear, 10), saison);
      licenceForm.setValue('catea', newCatea);
    }
  }, [gender, birthYear, saison, licenceForm]);

  const onSubmit = async (data: FormValues) => {
    try {
      const licenceData = {
        name: data.name,
        firstName: data.firstName,
        licenceNumber: data.licenceNumber || undefined,
        gender: data.gender,
        birthYear: data.birthYear,
        dept: data.dept,
        fede: data.fede,
        club: data.club || undefined,
        catea: data.catea,
        catev: data.catev || undefined,
        catevCX: data.catevCX || undefined,
        saison: data.saison,
        comment: data.comment || undefined,
      };

      if (isEditing && updatingLicence) {
        await updateLicence.mutateAsync({
          id: updatingLicence.id,
          updates: licenceData,
        });
        showSuccessToast('Licence mise à jour', `${data.firstName} ${data.name}`);
      } else {
        await createLicence.mutateAsync(licenceData);
        showSuccessToast('Licence créée', `${data.firstName} ${data.name}`);
        navigate('/licences');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showErrorToast("Erreur lors de l'enregistrement", message);
    }
  };

  return (
    <Form {...licenceForm}>
      <form onSubmit={licenceForm.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        {/* 1) Fédération, Numéro de licence, Saison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <SelectField
            form={licenceForm}
            field="fede"
            label="Fédération"
            options={FEDERATION_OPTIONS}
            required
          />
          {!isNL && (
            <>
              <StringField
                field="licenceNumber"
                form={licenceForm}
                label="Numéro de licence"
              />
              <StringField
                field="saison"
                form={licenceForm}
                label="Saison"
                description={FIELD_HELPER_TEXTS.saison}
                required
              />
            </>
          )}
        </div>

        {/* 2) Nom, Prénom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <StringField
            field="name"
            form={licenceForm}
            label="Nom"
            description={FIELD_HELPER_TEXTS.name}
            required
          />
          <StringField
            field="firstName"
            form={licenceForm}
            label="Prénom"
            description={firstNameHelperText}
            required
          />
        </div>

        {/* 3) Genre, Année de naissance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <SelectField
            form={licenceForm}
            field="gender"
            label="Genre"
            options={[
              { value: 'H', label: 'Masculin' },
              { value: 'F', label: 'Dames' },
            ]}
            required
          />
          <StringField
            field="birthYear"
            form={licenceForm}
            label="Année de naissance"
            description={FIELD_HELPER_TEXTS.birthYear}
            required
          />
        </div>

        {/* 4) Capsule Catégories - visible uniquement si fédération sélectionnée */}
        {fede && (
          <Card className="bg-muted/30 border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-primary" />
                Catégories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!gender || !birthYear ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Info className="h-4 w-4" />
                  {FIELD_HELPER_TEXTS.catea}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <SelectField
                    form={licenceForm}
                    field="catea"
                    label="Catégorie d'âge"
                    options={cateaOptions}
                    required
                  />
                  <SelectField
                    form={licenceForm}
                    field="catev"
                    label="Catégorie de valeur"
                    options={catevOptions}
                    required
                  />
                  <SelectField
                    form={licenceForm}
                    field="catevCX"
                    label="Catégorie CX"
                    options={catevCXOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 5) Département, Club */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <ComboboxField
            form={licenceForm}
            field="dept"
            label="Département"
            options={departmentOptions}
            isLoading={isLoadingDepartments}
            description={FIELD_HELPER_TEXTS.dept}
            required
          />
          {!isNL && (
            <Controller
              control={licenceForm.control}
              name="club"
              render={({ field, fieldState }) => (
                <ClubAutocomplete
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  fede={fede}
                  department={selectedDepartment}
                  disabled={!fede || !selectedDepartment}
                  error={fieldState.error?.message}
                  description={clubHelperText}
                />
              )}
            />
          )}
        </div>

        {/* 6) Commentaire pleine largeur */}
        <Field>
          <FieldLabel htmlFor="comment">Commentaires</FieldLabel>
          <Textarea
            id="comment"
            placeholder="Ajouter des commentaires additionnels"
            className="resize-none min-h-[100px]"
            {...licenceForm.register('comment')}
          />
          <FieldDescription>Informations complémentaires sur le licencié</FieldDescription>
        </Field>

        {/* Informations de dernière modification */}
        {updatingLicence?.lastChanged && updatingLicence?.author && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            Dernière modification le{' '}
            {new Date(updatingLicence.lastChanged).toLocaleDateString('fr-FR')} à{' '}
            {new Date(updatingLicence.lastChanged).toLocaleTimeString('fr-FR')} par{' '}
            {updatingLicence.author}
          </div>
        )}

        {/* Bouton Enregistrer */}
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Mettre à jour' : 'Créer la licence'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
