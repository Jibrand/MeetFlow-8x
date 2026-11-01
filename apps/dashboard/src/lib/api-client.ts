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
const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:4000/api/v1';

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Always send HTTP-only cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized, attempt refresh once if not calling auth endpoints
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: defaultHeaders,
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(true);
            return apiClient<T>(endpoint, options);
          } else {
            isRefreshing = false;
            onRefreshed(false);
          }
        } catch {
          isRefreshing = false;
          onRefreshed(false);
        }
      } else {
        // Wait for active refresh to finish
        const retryPromise = new Promise<T>((resolve, reject) => {
          addRefreshSubscriber((success) => {
            if (success) {
              resolve(apiClient<T>(endpoint, options));
            } else {
              reject(
                new ApiError(401, {
                  code: 'UNAUTHORIZED',
                  message: 'Session expired. Please sign in again.',
                })
              );
            }
          });
        });
        return retryPromise;
      }
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
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: (error as Error).message || 'Unable to connect to MeetFlow server',
    });
  }
}
