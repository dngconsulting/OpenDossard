import { Mail, Phone, Shield, User } from 'lucide-react';

import Layout from '@/components/layout/Layout.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import useUserStore from '@/store/UserStore.ts';

export default function AccountPage() {
  const { user } = useUserStore();

  const initials = `${user!.firstName[0]}${user!.lastName[0]}`.toUpperCase();
  const fullName = `${user!.firstName} ${user!.lastName}`;

  return (
    <Layout title="Mon compte" noPadding>
      <Card className="w-full">
        <CardHeader className="pb-0">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                <AvatarImage src="" alt={fullName} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
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

          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
    </Layout>
  );
}
