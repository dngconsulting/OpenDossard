import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/navigation/ProtectedRoute.tsx';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { ThemeProvider } from '@/components/theme-provider';
import AccountPage from '@/pages/AccountPage.tsx';
import AchievementsPage from '@/pages/AchievementsPage.tsx';
import ChallengesPage from '@/pages/ChallengesPage.tsx';
import CompetitionDetailPage from '@/pages/CompetitionDetailPage.tsx';
import CompetitionsPage from '@/pages/CompetitionsPage.tsx';
import DashboardPage from '@/pages/DashboardPage.tsx';
import LicenceDetailPage from '@/pages/LicenceDetailPage.tsx';
import LicencesPage from '@/pages/LicencesPage.tsx';
import LoginPage from '@/pages/LoginPage.tsx';
import NotFoundPage from '@/pages/NotFoundPage.tsx';
import PalmaresPage from '@/pages/PalmaresPage.tsx';
import RacesPage from '@/pages/RacesPage.tsx';
import UsersPage from '@/pages/UsersPage.tsx';
import WelcomePage from '@/pages/WelcomePage.tsx';
import { ApiError, handleGlobalError } from '@/utils/error-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // No retry on client errors (4XX)
        if (error instanceof ApiError && error.category === 'client') {
          return false;
        }
        // No retry on auth errors
        if (error instanceof ApiError && error.category === 'auth') {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
  queryCache: new QueryCache({
    onError: error => handleGlobalError(error),
  }),
  mutationCache: new MutationCache({
    onError: error => handleGlobalError(error),
  }),
});

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="backoffice-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/licences" element={<LicencesPage />} />
                <Route path="/licence/new" element={<LicenceDetailPage />} />
                <Route path="/licence/:id" element={<LicenceDetailPage />} />
                <Route path="/competitions" element={<CompetitionsPage />} />
                <Route path="/competition/new" element={<CompetitionDetailPage />} />
                <Route path="/competition/:id" element={<CompetitionDetailPage />} />
                <Route path="/races" element={<RacesPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/palmares/:licenceId?" element={<PalmaresPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>

              {/* 404 - Page non trouvée */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <UpdatePrompt />
        <OfflineBanner />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
