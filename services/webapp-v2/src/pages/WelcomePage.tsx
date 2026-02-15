import {
  ArrowRight,
  Bike,
  Calendar,
  ChevronRight,
  IdCard,
  LayoutDashboard,
  ListOrdered,
  Menu,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useDashboard } from '@/hooks/useDashboard';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { appData } from '@/statics/app-data';

const features = [
  {
    icon: IdCard,
    title: 'Gestion des licences',
    description: 'Gérez facilement tous vos licenciés avec import/export CSV',
    href: '/licences',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Bike,
    title: 'Épreuves & Résultats',
    description: 'Organisez vos courses et saisissez les résultats en temps réel',
    href: '/competitions',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Trophy,
    title: 'Challenges',
    description: 'Suivez les classements et challenges tout au long de la saison',
    href: '/challenges',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: ListOrdered,
    title: 'Palmarès',
    description: "Consultez l'historique complet des performances",
    href: '/palmares',
    color: 'from-purple-500 to-violet-500',
  },
];

const quickStats = [
  { label: 'Licenciés', key: 'totalLicenses' as const, icon: Users },
  { label: 'Épreuves', key: 'totalCompetitions' as const, icon: Calendar },
];

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  delay: number;
}) {
  return (
    <div className="glass rounded-2xl p-6 hover-lift" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  color,
  index,
}: {
  icon: typeof IdCard;
  title: string;
  description: string;
  href: string;
  color: string;
  index: number;
}) {
  return (
    <Link
      to={href}
      className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ animationDelay: `${index * 100 + 200}ms` }}
    >
      {/* Gradient accent bar */}
      <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${color} opacity-80`} />

      {/* Icon */}
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className="h-7 w-7" />
      </div>

      {/* Content */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>

      {/* Arrow */}
      <div className="flex items-center text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Accéder
        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function WelcomeHeader() {
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="header-sidebar flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 w-full">
        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" className="header-icon size-8" onClick={toggleSidebar}>
              <Menu className="size-5" />
            </Button>
            <div className="flex-1 flex justify-center">
              <img src={appData.app.logoUrl} alt="logo" className="h-8 w-auto" />
            </div>
            {/* Spacer pour équilibrer le burger menu */}
            <div className="size-8" />
          </>
        ) : (
          <>
            <SidebarTrigger className="header-icon -ml-1" />
            <Separator
              orientation="vertical"
              className="header-separator mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="flex-1 font-medium">Accueil</h1>
          </>
        )}
      </div>
    </header>
  );
}

export default function WelcomePage() {
  const { data: dashboardData } = useDashboard();

  const stats = dashboardData?.stats;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <WelcomeHeader />

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-6 p-4 pt-4 overflow-auto">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12">
            {/* Decorative elements */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            {/* Floating shapes */}
            <div className="absolute right-10 top-10 h-20 w-20 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
            <div
              className="absolute bottom-10 right-32 h-12 w-12 animate-pulse rounded-full bg-white/10 backdrop-blur-sm"
              style={{ animationDelay: '500ms' }}
            />

            <div className="relative z-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Version 2.0 - Nouvelle expérience
              </div>

              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                Bienvenue sur{' '}
                <span className="relative">
                  Open Dossard
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path
                      d="M2 6C50 2 150 2 198 6"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mb-8 text-lg text-white/80">
                La plateforme complète pour gérer vos compétitions cyclistes. Licences, courses,
                résultats et classements en un seul endroit.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-lg"
                >
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Tableau de bord
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Link to="/licences">
                    Voir les licences
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          {stats && (
            <section className="stagger-children grid gap-4 md:grid-cols-2">
              {quickStats.map((stat, index) => (
                <StatCard
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stats[stat.key] ?? '—'}
                  delay={index * 100}
                />
              ))}
            </section>
          )}

          {/* Features Grid */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Accès rapide</h2>
                <p className="text-sm text-muted-foreground">
                  Naviguez vers les fonctionnalités principales
                </p>
              </div>
            </div>

            <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} index={index} />
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="glass rounded-2xl p-6 md:p-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Besoin d'aide ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Consultez la documentation ou contactez le support
                  </p>
                </div>
              </div>
              <Button variant="outline" className="hover-scale" asChild>
                <a href="https://www.opendossard.com" target="_blank" rel="noopener noreferrer">
                  Voir la documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
