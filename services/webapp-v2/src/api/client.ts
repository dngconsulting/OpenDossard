import { ApiError } from '@/utils/error-handler/error-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v2';

// Auth accessor functions - set by the auth store to avoid circular dependencies
let getAccessToken: (() => string | null) | null = null;
let logoutFn: (() => void) | null = null;

export function setAuthAccessors(getToken: () => string | null, logout: () => void) {
  getAccessToken = getToken;
  logoutFn = logout;
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

  // Handle 401 Unauthorized - logout user
  if (response.status === 401) {
    logoutFn?.();
    throw new ApiError({
      status: 401,
      endpoint: fullEndpoint,
      serverMessage: 'Session expirée',
    });
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
