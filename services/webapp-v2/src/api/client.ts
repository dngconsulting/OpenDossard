import { ApiError } from '@/utils/error-handler/error-types';
import { authApi } from '@/api/auth.api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2';

// Auth accessor functions - set by the auth store to avoid circular dependencies
let getAccessToken: (() => string | null) | null = null;
let getRefreshToken: (() => string | null) | null = null;
let setTokensFn: ((accessToken: string, refreshToken: string) => void) | null = null;
let logoutFn: (() => void) | null = null;

// Mutex to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

export function setAuthAccessors(
  getToken: () => string | null,
  getRefresh: () => string | null,
  setTokens: (accessToken: string, refreshToken: string) => void,
  logout: () => void,
) {
  getAccessToken = getToken;
  getRefreshToken = getRefresh;
  setTokensFn = setTokens;
  logoutFn = logout;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken?.();
  if (!refreshToken) return false;

  try {
    const tokens = await authApi.refresh(refreshToken);
    setTokensFn?.(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// Ensure only one refresh runs at a time
async function refreshTokenOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options?.headers,
  };

  // Add auth header if we have a token
  const token = getAccessToken?.();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const fullEndpoint = `${options?.method || 'GET'} ${endpoint}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    // Network error (Failed to fetch, CORS, etc.)
    throw new ApiError({
      status: 0,
      endpoint: fullEndpoint,
      serverMessage: error instanceof Error ? error.message : 'Network error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // Handle 401 Unauthorized - attempt token refresh before logging out
  if (response.status === 401) {
    const refreshed = await refreshTokenOnce();

    if (refreshed) {
      // Retry the original request with the new token
      const newToken = getAccessToken?.();
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      }

      try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } catch (error) {
        throw new ApiError({
          status: 0,
          endpoint: fullEndpoint,
          serverMessage: error instanceof Error ? error.message : 'Network error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }

      // If still 401 after refresh, logout
      if (response.status === 401) {
        logoutFn?.();
        throw new ApiError({
          status: 401,
          endpoint: fullEndpoint,
          serverMessage: 'Session expirée',
        });
      }
    } else {
      // Refresh failed - logout
      logoutFn?.();
      throw new ApiError({
        status: 401,
        endpoint: fullEndpoint,
        serverMessage: 'Session expirée',
      });
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    // Pass the message as-is (can be string or array from NestJS validation)
    // Also include error field if message is not available
    const serverMessage = errorBody.message || errorBody.error || response.statusText;
    throw new ApiError({
      status: response.status,
      endpoint: fullEndpoint,
      serverMessage,
      stack: new Error().stack,
    });
  }

  // Handle empty responses (204 No Content)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}
