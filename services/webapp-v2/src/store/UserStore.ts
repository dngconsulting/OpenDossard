import { create } from 'zustand'

import { authApi } from '@/api/auth.api'
import type { UserProfile } from '@/api/auth.api'

const STORAGE_KEYS = {
  REFRESH_TOKEN: 'od_refresh_token',
  REMEMBER_ME: 'od_remember_me',
} as const

export type User = UserProfile

type AuthState = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthActions = {
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<boolean>
  checkAuth: () => Promise<void>
  clearError: () => void
  setAccessToken: (token: string) => void
  getAccessToken: () => string | null
}

type UserStore = AuthState & AuthActions

const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string, remember: boolean) => {
    set({ isLoading: true, error: null })

    try {
      const tokens = await authApi.login({ email, password })

      // Store access token in memory
      set({ accessToken: tokens.accessToken })

      // Store refresh token in localStorage if remember me is checked
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
      } else {
        // Store refresh token in sessionStorage for current session only
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
      }

      // Fetch user profile
      const profile = await authApi.getProfile(tokens.accessToken)

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      })
      throw error
    }
  },

  logout: () => {
    const { accessToken } = get()

    // Call logout API (fire and forget)
    if (accessToken) {
      authApi.logout(accessToken)
    }

    // Clear all stored tokens
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },

  refreshToken: async () => {
    // Try to get refresh token from localStorage or sessionStorage
    const refreshToken =
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

    if (!refreshToken) {
      return false
    }

    try {
      const tokens = await authApi.refresh(refreshToken)

      // Update access token in memory
      set({ accessToken: tokens.accessToken })

      // Update refresh token in appropriate storage
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
      } else {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
      }

      return true
    } catch {
      // Clear everything on refresh failure
      get().logout()
      return false
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })

    // Check if we have a refresh token stored
    const refreshToken =
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

    if (!refreshToken) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      // Try to refresh the token
      const tokens = await authApi.refresh(refreshToken)

      // Update access token in memory
      set({ accessToken: tokens.accessToken })

      // Update refresh token in appropriate storage
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
      } else {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
      }

      // Fetch user profile
      const profile = await authApi.getProfile(tokens.accessToken)

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // Clear tokens on failure
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),

  setAccessToken: (token: string) => set({ accessToken: token }),

  getAccessToken: () => get().accessToken,
}))

export default useUserStore
