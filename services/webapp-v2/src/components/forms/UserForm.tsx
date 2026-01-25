import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSet, StringField, Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { RolesMultiSelect } from '@/components/ui/roles-multi-select';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import type { UserType } from '@/types/users';

const createFormSchema = (isCreating: boolean) =>
  z
    .object({
      email: z.string().email('Email invalide'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      roles: z.string().min(1, 'Au moins un rôle est requis'),
      password: isCreating
        ? z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        : z.string().optional(),
      confirmPassword: isCreating ? z.string() : z.string().optional(),
    })
    .refine(
      data => {
        if (isCreating) {
          return data.password === data.confirmPassword;
        }
        return true;
      },
      {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
      }
    );

type UserFormProps = {
  user?: UserType;
  isCreating: boolean;
  onSuccess: () => void;
};

export const UserForm = ({ user, isCreating, onSuccess }: UserFormProps) => {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const formSchema = createFormSchema(isCreating);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      roles: user?.roles ?? 'ORGANISATEUR',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isCreating) {
        await createUser.mutateAsync({
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          roles: data.roles,
          password: data.password!,
        });
        toast.success('Utilisateur créé avec succès');
      } else if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          updates: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            roles: data.roles,
          },
        });
        toast.success('Utilisateur mis à jour avec succès');
      }
      onSuccess();
    } catch {
      // Error is handled by the global error handler
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6">
        <FieldGroup>
          <FieldSet>
            <StringField
              field="email"
              form={form}
              label="Email"
              type="email"
              autoComplete="email"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StringField field="lastName" form={form} label="Nom" autoComplete="family-name" />
              <StringField field="firstName" form={form} label="Prénom" autoComplete="given-name" />
            </div>
            <StringField field="phone" form={form} label="Téléphone" type="tel" autoComplete="tel" />

            <Field data-invalid={!!form.formState.errors.roles}>
              <FieldLabel>
                Rôles
                <span className="text-destructive">*</span>
              </FieldLabel>
              <RolesMultiSelect
                roles={form.watch('roles')}
                onChange={value => form.setValue('roles', value, { shouldValidate: true })}
              />
              {form.formState.errors.roles && (
                <FieldError errors={[form.formState.errors.roles]} />
              )}
            </Field>

            {isCreating && (
              <>
                <StringField
                  field="password"
                  form={form}
                  label="Mot de passe"
                  type="password"
                  autoComplete="new-password"
                  required
                  description="Minimum 8 caractères"
                />
                <StringField
                  field="confirmPassword"
                  form={form}
                  label="Confirmer le mot de passe"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </>
            )}
          </FieldSet>

          <FieldSet>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Enregistrement...' : isCreating ? 'Créer' : 'Enregistrer'}
            </Button>
          </FieldSet>
        </FieldGroup>
      </form>
    </Form>
  );
};
