import { Check, Eye, EyeOff, Key, Loader2, Mail, Phone, Shield, User } from 'lucide-react';
import { useState } from 'react';

import { authApi } from '@/api/auth.api';
import Layout from '@/components/layout/Layout.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import useUserStore from '@/store/UserStore.ts';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

export default function AccountPage() {
  const { user, accessToken } = useUserStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = `${user!.firstName[0]}${user!.lastName[0]}`.toUpperCase();
  const fullName = `${user!.firstName} ${user!.lastName}`;

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showErrorToast('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword(accessToken!, newPassword);
      showSuccessToast('Mot de passe modifié avec succès');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
      const details = error instanceof Error && error.stack ? error.stack : undefined;
      showErrorToast(message, details);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Mon compte" noPadding>
      <Card className="w-full">
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

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Prénom</p>
                  <p className="font-medium">{user!.firstName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{user!.lastName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium truncate">{user!.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  {user!.phone ? (
                    <p className="font-medium">{user!.phone}</p>
                  ) : (
                    <p className="font-medium text-muted-foreground italic">Non renseigné</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Section Mot de passe */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Nouveau mot de passe</p>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 h-9 bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Confirmer le mot de passe</p>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 h-9 bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className="w-full mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modification en cours...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
    </Layout>
  );
}
