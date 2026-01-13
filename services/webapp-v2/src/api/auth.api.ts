const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2'

export interface LoginRequest {
  email: string
  password: string
}

export interface TokensResponse {
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  roles: string
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<TokensResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Identifiant ou mot de passe invalide(s)')
    }

    return response.json()
  },

  async refresh(refreshToken: string): Promise<TokensResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Session expirée')
    }

    return response.json()
  },

  async getProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Impossible de récupérer le profil')
    }

    return response.json()
  },

  async logout(accessToken: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => {
      // Ignore logout errors - we clear local state anyway
    })
  },
}
