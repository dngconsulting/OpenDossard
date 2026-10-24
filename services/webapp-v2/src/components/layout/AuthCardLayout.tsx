import { EnvironmentBanner } from '@/components/layout/EnvironmentBanner';
import { appData } from '@/statics/app-data';

import type { ReactNode } from 'react';

interface AuthCardLayoutProps {
  title: string;
  subtitle?: string;
  /** Classes additionnelles de la carte (ex. `animate-shake` du login). */
  cardClassName?: string;
  children: ReactNode;
}

/**
 * Habillage commun des pages publiques d'authentification : fond dégradé,
 * décorations, logo, carte vitrée et pied de page.
 */
export function AuthCardLayout({ title, subtitle, cardClassName, children }: AuthCardLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-hero relative overflow-hidden">
      <EnvironmentBanner fixed />
      {/* Décorations d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-sidebar-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo et branding */}
        <div className="text-center fade-in">
          <div className="flex justify-center">
            <img
              src={appData.app.logoUrl}
              alt={appData.app.name}
              className="w-24 h-24 object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{appData.app.name}</h1>
            <p className="mt-2 text-white/70 text-lg">
              Gestion des licences et compétitions cyclistes
            </p>
          </div>
        </div>

        {/* Carte */}
        <div
          className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6 fade-in ${
            cardClassName ?? ''
          }`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
          </div>

          {children}
        </div>

        {/* Pied de page */}
        <p className="text-center text-white/40 text-sm fade-in" style={{ animationDelay: '0.2s' }}>
          &copy; {new Date().getFullYear()} {appData.app.name} &bull; v{appData.app.version}
        </p>
      </div>

      {/* Animation de secousse et dégradé radial */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
}
