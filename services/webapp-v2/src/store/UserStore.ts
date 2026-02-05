import { create } from 'zustand';

import { authApi } from '@/api/auth.api';
import type { UserProfile } from '@/api/auth.api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'od_access_token',
  REFRESH_TOKEN: 'od_refresh_token',
  REMEMBER_ME: 'od_remember_me',
} as const;

type User = UserProfile;

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
};

type UserStore = AuthState & AuthActions;

// Helper to get stored token
const getStoredToken = (key: string): string | null => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  accessToken: getStoredToken(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: getStoredToken(STORAGE_KEYS.REFRESH_TOKEN),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string, remember: boolean) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login({ email, password });

      // Store tokens
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }

      set({ accessToken: response.accessToken, refreshToken: response.refreshToken });

      // Fetch user profile
      const profile = await authApi.getProfile(response.accessToken);

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      });
      throw error;
    }
  },

  logout: () => {
    const { accessToken } = get();

    // Call logout API (fire and forget)
    if (accessToken) {
      authApi.logout(accessToken);
    }

    // Clear all stored tokens
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });

    const token = getStoredToken(STORAGE_KEYS.ACCESS_TOKEN);
    const refresh = getStoredToken(STORAGE_KEYS.REFRESH_TOKEN);

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      // Validate token by fetching profile
      const profile = await authApi.getProfile(token);

      set({
        user: profile,
        accessToken: token,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token invalid - clear everything
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  getAccessToken: () => get().accessToken,

  getRefreshToken: () => get().refreshToken,

  setTokens: (accessToken: string, refreshToken: string) => {
    // Persist to the same storage type the user chose at login
    const useLocalStorage = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';

    if (useLocalStorage) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    set({ accessToken, refreshToken });
  },
}));

export default useUserStore;
