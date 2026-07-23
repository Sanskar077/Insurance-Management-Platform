const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const TOKEN_STORAGE_KEY = 'auth_token';

export class ApiError extends Error {
  public readonly status: number;
  public readonly fieldErrors?: { path: string; message: string }[];

  constructor(message: string, status: number, fieldErrors?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.errors,
    );
  }

  return payload as T;
}
