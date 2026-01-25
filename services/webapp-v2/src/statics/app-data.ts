import {
  BookOpen,
  Bot,
  Building2,
  Calendar,
  Home,
  IdCard,
  LayoutDashboard,
  ListOrdered,
  Settings2,
  SquareTerminal,
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
    version: '2.0.0',
  },
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
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
