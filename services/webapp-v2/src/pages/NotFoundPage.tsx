import { Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { appData } from '@/statics/app-data'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-hero relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-sidebar-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
            <img
              src={appData.app.logoUrl}
              alt={appData.app.name}
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        {/* 404 Card */}
        <div
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 space-y-6 fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          {/* 404 Number */}
          <div className="relative">
            <span className="text-[120px] font-bold text-white/10 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white">404</span>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white">
              Page introuvable
            </h1>
            <p className="text-white/60">
              Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1 h-11 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex-1 h-11 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p
          className="text-white/40 text-sm fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          &copy; {new Date().getFullYear()} {appData.app.name} &bull; v{appData.app.version}
        </p>
      </div>

      {/* Custom styles */}
      <style>{`
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  )
}
