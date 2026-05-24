const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AbortError extends Error {
  constructor(message = 'Request aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export class ParseError extends Error {
  constructor(message = 'Failed to parse response') {
    super(message);
    this.name = 'ParseError';
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : undefined;
}

function getCurrentLng(): string {
  if (typeof window === 'undefined') return 'es';
  const match = window.location.pathname.match(/^\/(en|es)(?:\/|$)/);
  return match?.[1] || 'es';
}

export interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: BodyInit | null;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function apiClient<T>(url: string, options?: ApiClientOptions): Promise<T> {
  const token = getCookie('user_token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options?.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const hasBody = options?.body !== null && options?.body !== undefined;
  if (hasBody && typeof options?.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      method: options?.method || 'GET',
      headers,
      credentials: 'include',
      body: options?.body ?? null,
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AbortError(err.message);
    }
    throw new NetworkError(err instanceof Error ? err.message : 'Network request failed');
  }

  // Handle 401 redirect
  if (response.status === 401) {
    const lng = getCurrentLng();
    if (typeof window !== 'undefined') {
      window.location.href = `/${lng}/login?auth_error=expired`;
    }
    throw new HttpError('Unauthorized', 401);
  }

  // Handle 429 lockout
  if (response.status === 429) {
    let remainingSeconds = 3600;
    try {
      const data = await response.json();
      remainingSeconds = data.remainingSeconds || remainingSeconds;
    } catch {
      // ignore parse failure
    }
    const err = new HttpError('Too many requests', 429, 'RATE_LIMITED', { remainingSeconds });
    throw err;
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let code: string | undefined;
    let details: unknown;
    try {
      const data = await response.json();
      message = data.error || data.message || message;
      code = data.code;
      details = data.details || data.errors;
    } catch {
      // ignore parse failure
    }
    throw new HttpError(message, response.status, code, details);
  }

  // Parse JSON body
  try {
    const data = await response.json();
    return data as T;
  } catch {
    throw new ParseError();
  }
}
