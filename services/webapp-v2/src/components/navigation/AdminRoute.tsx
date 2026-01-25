import { Navigate, Outlet } from 'react-router-dom';

import useUserStore from '@/store/UserStore';

export function AdminRoute() {
  const user = useUserStore(state => state.user);

  // Check if user has ADMIN role
  const isAdmin = user?.roles?.includes('ADMIN');

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
