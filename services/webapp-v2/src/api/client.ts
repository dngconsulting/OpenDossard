const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2'

// Auth accessor functions - set by the auth store to avoid circular dependencies
let getAccessToken: (() => string | null) | null = null
let logoutFn: (() => void) | null = null

export function setAuthAccessors(
  getToken: () => string | null,
  logout: () => void
) {
  getAccessToken = getToken
  logoutFn = logout
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
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

  // Handle 401 Unauthorized - logout user
  if (response.status === 401) {
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
