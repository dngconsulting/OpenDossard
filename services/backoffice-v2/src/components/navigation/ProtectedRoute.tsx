import {Navigate, Outlet} from 'react-router-dom';

import useUserStore from '@/store/UserStore.ts';

export function ProtectedRoute() {
    const user = useUserStore((state) => state.user)

    if (!user) {
        // Pas connecté → redirection
        return <Navigate to="/login" replace />
    }

    // Connecté → on affiche la page enfant
    return <Outlet />
}
