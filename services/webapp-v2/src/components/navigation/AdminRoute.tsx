import { Navigate, Outlet } from 'react-router-dom';

import useUserStore from '@/store/UserStore';

type AdminRouteProps = {
  /** Rôle exigé pour les routes enfants. Par défaut : ADMIN. */
  role?: 'ADMIN' | 'SUPER_ADMIN';
};

export function AdminRoute({ role = 'ADMIN' }: AdminRouteProps) {
  const hasRole = useUserStore(state => state.user?.roles?.includes(role));

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
