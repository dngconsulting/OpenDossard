const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2'

// Token accessor functions - set by the auth store to avoid circular dependencies
let getAccessToken: (() => string | null) | null = null
let refreshTokenFn: (() => Promise<boolean>) | null = null
let logoutFn: (() => void) | null = null

export function setAuthAccessors(
  getToken: () => string | null,
  refresh: () => Promise<boolean>,
  logout: () => void
) {
  getAccessToken = getToken
  refreshTokenFn = refresh
  logoutFn = logout
}

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const makeRequest = async (retry = true): Promise<T> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }

    // Add auth header if we have a token
    const token = getAccessToken?.()
    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retry && refreshTokenFn) {
      // If already refreshing, wait for the current refresh to complete
      if (isRefreshing && refreshPromise) {
        const refreshed = await refreshPromise
        if (refreshed) {
          return makeRequest(false)
        }
      } else {
        // Start a new refresh
        isRefreshing = true
        refreshPromise = refreshTokenFn()

        try {
          const refreshed = await refreshPromise
          if (refreshed) {
            return makeRequest(false)
          }
        } finally {
          isRefreshing = false
          refreshPromise = null
        }
      }

      // Refresh failed, logout
      logoutFn?.()
      throw new Error('Session expirée')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API Error: ${response.statusText}`)
    }

    // Handle empty responses (204 No Content)
    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text)
  }

  return makeRequest()
}
