import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { AdminRoute } from '@/components/navigation/AdminRoute';
import { ProtectedRoute } from '@/components/navigation/ProtectedRoute.tsx';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { ThemeProvider } from '@/components/theme-provider';
import AccountPage from '@/pages/account/AccountPage.tsx';
import LoginPage from '@/pages/account/LoginPage.tsx';
import UserDetailPage from '@/pages/account/UserDetailPage.tsx';
import ChallengePage from '@/pages/challenge/ChallengePage.tsx';
import ChallengesPage from '@/pages/challenge/ChallengesPage.tsx';
import ClassementsPage from '@/pages/classement/ClassementsPage.tsx';
import ClubDetailPage from '@/pages/club/ClubDetailPage.tsx';
import ClubsPage from '@/pages/club/ClubsPage.tsx';
import CompetitionDetailPage from '@/pages/competition/CompetitionDetailPage.tsx';
import CompetitionsPage from '@/pages/competition/CompetitionsPage.tsx';
import DashboardPage from '@/pages/dashboard/DashboardPage.tsx';
import EngagementsPage from '@/pages/engagement/EngagementsPage.tsx';
import LicenceDetailPage from '@/pages/licence/LicenceDetailPage.tsx';
import LicencesPage from '@/pages/licence/LicencesPage.tsx';
import PalmaresPage from '@/pages/palmares/PalmaresPage.tsx';
import NotFoundPage from '@/pages/status/NotFoundPage.tsx';
import UsersPage from '@/pages/users/UsersPage.tsx';
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
                <Route path="/challenges/:id" element={<ChallengePage />} />
                <Route path="/licences" element={<LicencesPage />} />
                <Route path="/licence/new" element={<LicenceDetailPage />} />
                <Route path="/licence/:id" element={<LicenceDetailPage />} />
                <Route path="/clubs" element={<ClubsPage />} />
                <Route path="/club/new" element={<ClubDetailPage />} />
                <Route path="/club/:id" element={<ClubDetailPage />} />
                <Route path="/competitions" element={<CompetitionsPage />} />
                <Route path="/competition/new" element={<CompetitionDetailPage />} />
                <Route path="/competition/:id" element={<CompetitionDetailPage />} />
                <Route path="/competition/:id/engagements" element={<EngagementsPage />} />
                <Route path="/competition/:id/classements" element={<ClassementsPage />} />
                <Route path="/palmares/:licenceId?" element={<PalmaresPage />} />
                {/* Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/user/new" element={<UserDetailPage />} />
                  <Route path="/user/:id" element={<UserDetailPage />} />
                </Route>
                <Route path="/account" element={<AccountPage />} />
              </Route>

              {/* 404 - Page non trouvée */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
        <UpdatePrompt />
        <OfflineBanner />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
