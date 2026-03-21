/** HTTP client for the configured API base URL (origin only; paths in this app already include `/api/...`). */
export function getApiBase(): string {
  let base = import.meta.env.VITE_API_BASE_URL ?? '';
  base = base.trim().replace(/\/+$/, '');
  // Avoid double `/api` when env is set to `http://host:8000/api` and paths are `/api/search/...`.
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

export interface ApiFetchOptions extends RequestInit {
  /** Optional user identity header for authenticated requests. */
  userId?: string | null;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { userId, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (userId) {
    headers.set('X-User-Id', userId);
  }

  const url = path.startsWith('http') ? path : `${getApiBase()}${path.startsWith('/') ? '' : '/'}${path}`;
  return fetch(url, { ...rest, headers });
}

const GENERIC_HTTP_ERROR = 'Unable to complete this request. Please try again.';

/** Safe message for UI: never includes request path or raw HTML error pages. */
export function parseHttpErrorMessage(rawBody: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed.startsWith('{')) {
    return GENERIC_HTTP_ERROR;
  }
  try {
    const parsed = JSON.parse(trimmed) as { detail?: unknown; message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.length > 0) {
      return parsed.message.length > 280 ? `${parsed.message.slice(0, 277)}…` : parsed.message;
    }
    const d = parsed.detail;
    if (typeof d === 'string' && d.length > 0) {
      return d.length > 280 ? `${d.slice(0, 277)}…` : d;
    }
  } catch {
    /* ignore */
  }
  return GENERIC_HTTP_ERROR;
}

export async function apiJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseHttpErrorMessage(text));
  }
  return response.json() as Promise<T>;
}
