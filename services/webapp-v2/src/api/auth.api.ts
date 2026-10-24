const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  organisation?: string | null;
  roles: string[];
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
  organisation?: string | null;
}

const NETWORK_ERROR_MESSAGE = 'Le service est momentanément indisponible';
const TOO_MANY_ATTEMPTS_MESSAGE = 'Trop de tentatives, réessayez dans quelques minutes';

/** Erreur HTTP d'une route publique : message lisible + nature de la réponse. */
class PublicApiError extends Error {
  readonly status: number;
  /** `message` reçu sous forme de tableau : erreurs de validation class-validator. */
  readonly isValidation: boolean;

  constructor(message: string, status: number, isValidation: boolean) {
    super(message);
    this.name = 'PublicApiError';
    this.status = status;
    this.isValidation = isValidation;
  }
}

export type ResetPasswordErrorKind = 'invalid-link' | 'validation' | 'other';

/**
 * Rejet de `resetPassword`, qualifié pour que l'écran réagisse sans comparer
 * le texte du message : `invalid-link` = 400 du service (token inconnu, utilisé
 * ou expiré), `validation` = 400 de class-validator, `other` = le reste.
 */
export class ResetPasswordError extends Error {
  readonly kind: ResetPasswordErrorKind;

  constructor(message: string, kind: ResetPasswordErrorKind) {
    super(message);
    this.name = 'ResetPasswordError';
    this.kind = kind;
  }
}

/**
 * Construit l'erreur d'une réponse NestJS non-ok. Les erreurs de validation
 * (class-validator) renvoient `message` sous forme de tableau : on garde le
 * premier élément, le plus pertinent pour l'utilisateur.
 */
async function toPublicApiError(response: Response, fallback: string): Promise<PublicApiError> {
  if (response.status === 429) {
    return new PublicApiError(TOO_MANY_ATTEMPTS_MESSAGE, response.status, false);
  }
  const body: { message?: unknown } = await response.json().catch(() => ({}));
  const { message } = body;
  if (Array.isArray(message)) {
    const first = message.find(
      (item): item is string => typeof item === 'string' && item.trim() !== '',
    );
    return new PublicApiError(first ?? fallback, response.status, true);
  }
  const text = typeof message === 'string' && message.trim() !== '' ? message : fallback;
  return new PublicApiError(text, response.status, false);
}

/** POST JSON public (sans jeton) : erreur réseau → message parlant. */
async function postPublic(path: string, payload: unknown, fallback: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Cf. `login` : `fetch` ne rejette que sur erreur réseau.
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw await toPublicApiError(response, fallback);
  }
}

function resetPasswordErrorKind(err: PublicApiError): ResetPasswordErrorKind {
  if (err.status !== 400) {
    return 'other';
  }
  return err.isValidation ? 'validation' : 'invalid-link';
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    } catch {
      // `fetch` ne rejette QUE sur erreur réseau (serveur arrêté →
      // ERR_CONNECTION_REFUSED, DNS, CORS bloqué). Le message natif
      // « Failed to fetch » est cryptique pour l'utilisateur : on le remplace
      // par un message parlant. Les erreurs HTTP (401, 400…) ne passent jamais
      // ici — elles résolvent la promesse et sont gérées par `!response.ok`.
      throw new Error(NETWORK_ERROR_MESSAGE);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Identifiant ou mot de passe invalide(s)');
    }

    return response.json();
  },

  async getProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Impossible de récupérer le profil');
    }

    return response.json();
  },

  async logout(accessToken: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => {
      // Ignore logout errors - we clear local state anyway
    });
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  async updateProfile(accessToken: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Impossible de mettre à jour le profil');
    }

    return response.json();
  },

  async changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Impossible de changer le mot de passe');
    }
  },

  /**
   * Demande d'un lien de réinitialisation. Le backend répond toujours 200
   * (même si le compte n'existe pas) pour ne pas révéler les comptes.
   */
  async forgotPassword(email: string): Promise<void> {
    await postPublic('/auth/forgot-password', { email }, "Impossible d'envoyer la demande");
  },

  /**
   * Réinitialisation du mot de passe à partir du jeton reçu par email.
   * Rejette toujours avec une `ResetPasswordError`.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await postPublic(
        '/auth/reset-password',
        { token, newPassword },
        'Impossible de réinitialiser le mot de passe',
      );
    } catch (err) {
      if (err instanceof PublicApiError) {
        throw new ResetPasswordError(err.message, resetPasswordErrorKind(err));
      }
      throw new ResetPasswordError(
        err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE,
        'other',
      );
    }
  },
};
