import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Lock, Save, UserCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { showSuccessToast } from '@/utils/error-handler/error-handler';
import { z } from 'zod';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() ?? '';
  const l = lastName?.charAt(0)?.toUpperCase() ?? '';
  return f + l || '?';
}

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

  const watchedFirstName = form.watch('firstName');
  const watchedLastName = form.watch('lastName');

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
        showSuccessToast('Utilisateur créé avec succès');
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
        showSuccessToast('Utilisateur mis à jour avec succès');
      }
      onSuccess();
    } catch {
      // Error is handled by the global error handler
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profil */}
        <Card className="bg-slate-100 dark:bg-muted/50 border-slate-200 dark:border-muted">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="h-4 w-4 text-primary" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="relative group cursor-pointer">
                  <Avatar className="h-20 w-20 text-lg">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                      {getInitials(watchedFirstName, watchedLastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Photo</span>
              </div>

              {/* Champs */}
              <div className="flex-1 w-full">
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
                  </FieldSet>
                </FieldGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mot de passe (création uniquement) */}
        {isCreating && (
          <Card className="bg-slate-100 dark:bg-muted/50 border-slate-200 dark:border-muted">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" />
                Mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FieldSet>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </FieldSet>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-center">
          <Button type="submit" size="sm" disabled={isPending} className="w-[150px]">
            <Save className="h-4 w-4" />
            {isPending ? 'Enregistrement...' : isCreating ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
