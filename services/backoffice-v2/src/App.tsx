import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from '@/components/navigation/ProtectedRoute.tsx';
import AccountPage from '@/pages/AccountPage.tsx';
import AchievementsPage from '@/pages/AchievementsPage.tsx';
import ChallengesPage from '@/pages/ChallengesPage.tsx';
import DashboardPage from '@/pages/DashboardPage.tsx';
import LicencesPage from '@/pages/LicencesPage.tsx';
import LoginPage from '@/pages/LoginPage.tsx';
import RacesPage from '@/pages/RacesPage.tsx';
import UsersPage from '@/pages/UsersPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/licences" element={<LicencesPage />} />
            <Route path="/races" element={<RacesPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
