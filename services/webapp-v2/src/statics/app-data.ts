import {
  Building2,
  Calendar,
  Home,
  IdCard,
  LayoutDashboard,
  ListOrdered,
  Trophy,
  User2,
} from 'lucide-react';

export const appData = {
  user: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@dossardeur.com',
    avatar: '/avatars/shadcn.jpg',
  },
  app: {
    name: 'Open Dossard',
    logoUrl: '/logood.png',
    version: __APP_VERSION__,
  },
  pages: [
    {
      name: 'Accueil',
      url: '/',
      icon: Home,
    },
    {
      name: 'Licences',
      url: '/licences',
      icon: IdCard,
    },
    {
      name: 'Clubs',
      url: '/clubs',
      icon: Building2,
    },
    {
      name: 'Épreuves',
      url: '/competitions',
      icon: Calendar,
    },
    {
      name: 'Challenges',
      url: '/challenges',
      icon: Trophy,
    },
    {
      name: 'Palmarès',
      url: '/palmares',
      icon: ListOrdered,
    },
    {
      name: 'Utilisateurs',
      url: '/users',
      icon: User2,
      requiredRoles: ['ADMIN'],
    },
    {
      name: 'Statistiques',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
  ],
};
