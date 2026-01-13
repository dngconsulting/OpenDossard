import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useUserStore from '@/store/UserStore';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useUserStore();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-hero">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/70 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the current URL (including search params) for redirect after login
    const currentUrl = location.pathname + location.search;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;

    return <Navigate to={loginUrl} replace />;
  }

  // User is authenticated, render the protected content
  return <Outlet />;
}
