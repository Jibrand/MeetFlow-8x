export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta: {
    requestId?: string;
    timestamp: string;
    version: string;
  };
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field?: string; message: string; code?: string }[];
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: { field?: string; message: string; code?: string }[];

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error.details;
  }
}

// Configurable API root URL: defaults to local backend /api/v1
export const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:4000/api/v1';

// Client-side session existence indicator (non-sensitive boolean flag only; NEVER store tokens/JWTs here)
const SESSION_ACTIVE_KEY = 'meetflow:session_active';

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSessionHint(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(SESSION_ACTIVE_KEY, '1');
    } else {
      localStorage.removeItem(SESSION_ACTIVE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

// In-flight refresh coordination: single shared promise prevents concurrent refresh spam
let refreshPromise: Promise<boolean> | null = null;
let sessionKnownInvalid = false;

export function resetSessionInvalidState(): void {
  sessionKnownInvalid = false;
}

export function markSessionInvalid(): void {
  sessionKnownInvalid = true;
  setSessionHint(false);
}

/**
 * Perform a single controlled refresh call.
 * Concurrent callers receive the identical in-flight promise.
 */
export async function performTokenRefresh(): Promise<boolean> {
  // If a refresh is already underway, coalesce into that promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // If session is already known to be invalid/missing and no hint exists, return false immediately
  if (sessionKnownInvalid && !hasSessionHint()) {
    return false;
  }

  refreshPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send HTTP-only cookie
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (res.ok) {
        sessionKnownInvalid = false;
        setSessionHint(true);
        return true;
      }

      // Expected unauthenticated outcome (401 REFRESH_TOKEN_REQUIRED or INVALID_REFRESH_TOKEN)
      sessionKnownInvalid = true;
      setSessionHint(false);
      return false;
    } catch {
      // Network error or backend unreachable
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { _isRetry?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Always send HTTP-only cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    signal: options.signal || controller.signal,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      const isAuthEndpoint =
        endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/register') ||
        endpoint.includes('/auth/refresh') ||
        endpoint.includes('/auth/logout');

      // Attempt token refresh at most ONCE for non-auth endpoints when session hint is active
      if (!isAuthEndpoint && !options._isRetry && !sessionKnownInvalid) {
        const shouldAttemptRefresh = hasSessionHint();
        if (shouldAttemptRefresh) {
          const refreshed = await performTokenRefresh();
          if (refreshed) {
            // Retry the original request exactly once with rotated credentials
            return apiClient<T>(endpoint, { ...options, _isRetry: true });
          }
        }
        // Immediately mark session invalid on refresh failure or absence of hint
        markSessionInvalid();
      }

      const json = await response.json().catch(() => null);
      const errPayload: ApiErrorPayload = json?.error || {
        code: 'UNAUTHORIZED',
        message: json?.message || response.statusText || 'Authentication required',
      };
      throw new ApiError(401, errPayload);
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errPayload: ApiErrorPayload = json?.error || {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Request failed',
      };
      throw new ApiError(response.status, errPayload);
    }

    return json?.data !== undefined ? json.data : json;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new ApiError(0, {
        code: 'TIMEOUT',
        message: 'Request to MeetFlow API timed out. Please check your backend connection.',
      });
    }
    // Network / connection error (e.g. ERR_CONNECTION_REFUSED, fetch failed)
    throw new ApiError(0, {
      code: 'API_UNAVAILABLE',
      message: 'Unable to connect to MeetFlow API server at ' + API_BASE_URL + '. Backend is offline.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
