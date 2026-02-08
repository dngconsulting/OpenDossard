import { zodResolver } from '@hookform/resolvers/zod';
import { Key, KeyRound, Loader2, Mail, Phone, Save, Shield, User } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { authApi } from '@/api/auth.api';
import Layout from '@/components/layout/Layout.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Field, FieldGroup, FieldLabel, FieldSet, StringField } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator.tsx';
import useUserStore from '@/store/UserStore.ts';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

const accountSchema = z
  .object({
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    phone: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    data => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.currentPassword && data.currentPassword.length > 0;
      }
      return true;
    },
    { message: 'Le mot de passe actuel est requis', path: ['currentPassword'] }
  )
  .refine(
    data => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword.length >= 6;
      }
      return true;
    },
    { message: 'Le mot de passe doit contenir au moins 6 caractères', path: ['newPassword'] }
  )
  .refine(
    data => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] }
  );

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const { user, accessToken, setUser } = useUserStore();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: user!.firstName ?? '',
      lastName: user!.lastName ?? '',
      phone: user!.phone?.replace(/\s/g, '') || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const initials = `${user!.firstName?.[0] || ''}${user!.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${user!.firstName} ${user!.lastName}`;

  const onSubmit = async (data: AccountFormValues) => {
    try {
      const hasProfileChanges =
        data.firstName !== user!.firstName ||
        data.lastName !== user!.lastName ||
        (data.phone || '') !== (user!.phone?.replace(/\s/g, '') || '');

      if (hasProfileChanges) {
        const updated = await authApi.updateProfile(accessToken!, {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phone: data.phone || undefined,
        });
        setUser({ ...user!, firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone });
      }

      if (data.newPassword && data.newPassword.length > 0) {
        await authApi.changePassword(accessToken!, data.currentPassword!, data.newPassword);
        form.setValue('currentPassword', '');
        form.setValue('newPassword', '');
        form.setValue('confirmPassword', '');
      }

      showSuccessToast('Modifications enregistrées');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      showErrorToast(message);
    }
  };

  return (
    <Layout title="Mon compte" noPadding>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-lg shrink-0">
                  <AvatarImage src="" alt={fullName} />
                  <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{fullName}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {user!.roles?.map(role => (
                      <Badge key={role} variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {role}
                      </Badge>
                    ))}
                    {(!user!.roles || user!.roles.length === 0) && (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Utilisateur
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <Separator className="mb-6" />

              <div className="max-w-lg">
                <FieldGroup>
                  <FieldSet>
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mt-6 shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Email</p>
                        <p className="font-medium truncate mt-2">{user!.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mt-6 shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <StringField field="lastName" form={form} label="Nom" autoComplete="family-name" required />
                        <StringField field="firstName" form={form} label="Prénom" autoComplete="given-name" required />
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mt-6 shrink-0">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Controller
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Téléphone</FieldLabel>
                              <Input
                                value={field.value?.replace(/(\d{2})(?=\d)/g, '$1 ') ?? ''}
                                onChange={e => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="06 12 34 56 78"
                                maxLength={14}
                                autoComplete="tel"
                              />
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                  </FieldSet>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-primary" />
                Changer le mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-lg">
                <FieldGroup>
                  <FieldSet>
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mt-6 shrink-0">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <StringField
                          field="currentPassword"
                          form={form}
                          label="Mot de passe actuel"
                          type="password"
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mt-6 shrink-0">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <StringField
                          field="newPassword"
                          form={form}
                          label="Nouveau mot de passe"
                          type="password"
                          autoComplete="new-password"
                          description="Minimum 6 caractères"
                        />
                        <StringField
                          field="confirmPassword"
                          form={form}
                          label="Confirmer"
                          type="password"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </FieldSet>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting} className="w-[150px]">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {form.formState.isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Form>
    </Layout>
  );
}
