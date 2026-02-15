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

function doFetch(url: string, options: RequestInit, logEndpoint: string): Promise<Response> {
  return fetch(url, options).catch((error) => {
    throw new ApiError({
      status: 0,
      endpoint: logEndpoint,
      serverMessage: error instanceof Error ? error.message : 'Network error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  });
}

async function authenticatedFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string>),
  };

  const token = getAccessToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullEndpoint = `${options?.method || 'GET'} ${endpoint}`;
  const fetchOptions: RequestInit = { ...options, headers };
  const url = `${API_BASE_URL}${endpoint}`;

  let response = await doFetch(url, fetchOptions, fullEndpoint);

  // Handle 401 Unauthorized - attempt token refresh then retry once
  if (response.status === 401) {
    const refreshed = await refreshTokenOnce();

    if (!refreshed) {
      logoutFn?.();
      throw new ApiError({ status: 401, endpoint: fullEndpoint, serverMessage: 'Session expirée' });
    }

    const newToken = getAccessToken?.();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
    }

    response = await doFetch(url, { ...options, headers }, fullEndpoint);

    if (response.status === 401) {
      logoutFn?.();
      throw new ApiError({ status: 401, endpoint: fullEndpoint, serverMessage: 'Session expirée' });
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError({
      status: response.status,
      endpoint: fullEndpoint,
      serverMessage: errorBody.message || errorBody.error || response.statusText,
      stack: new Error().stack,
    });
  }

  return response;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(endpoint, options);

  // Handle empty responses (204 No Content)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

export async function apiFetchBlob(endpoint: string): Promise<Blob> {
  const response = await authenticatedFetch(endpoint);
  return response.blob();
}
