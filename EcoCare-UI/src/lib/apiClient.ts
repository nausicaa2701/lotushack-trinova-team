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

export class ApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiFetchOptions extends RequestInit {
  /** Optional user identity header for authenticated requests. */
  userId?: string | null;
}

const GENERIC_HTTP_ERROR = 'Unable to complete this request. Please try again.';
const NETWORK_HTTP_ERROR = 'Unable to reach the service. Check your connection and try again.';

function clampMessage(value: string): string {
  return value.length > 280 ? `${value.slice(0, 277)}...` : value;
}

function parseValidationDetail(detail: unknown): string | null {
  if (!Array.isArray(detail)) {
    return null;
  }

  const firstIssue = detail.find((entry): entry is { msg?: unknown; loc?: unknown } => typeof entry === 'object' && entry !== null);
  if (!firstIssue) {
    return null;
  }

  const message = typeof firstIssue.msg === 'string' ? firstIssue.msg : null;
  const location = Array.isArray(firstIssue.loc)
    ? firstIssue.loc
        .filter((segment): segment is string | number => typeof segment === 'string' || typeof segment === 'number')
        .join('.')
    : '';

  if (message && location) {
    return clampMessage(`${location}: ${message}`);
  }

  if (message) {
    return clampMessage(message);
  }

  return null;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { userId, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (userId) {
    headers.set('X-User-Id', userId);
  }

  const url = path.startsWith('http') ? path : `${getApiBase()}${path.startsWith('/') ? '' : '/'}${path}`;
  try {
    return await fetch(url, { ...rest, headers });
  } catch {
    throw new ApiError(NETWORK_HTTP_ERROR, null);
  }
}

/** Safe message for UI: never includes request path or raw HTML error pages. */
export function parseHttpErrorMessage(rawBody: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return GENERIC_HTTP_ERROR;
  }
  if (!trimmed.startsWith('{')) {
    return GENERIC_HTTP_ERROR;
  }
  try {
    const parsed = JSON.parse(trimmed) as { detail?: unknown; message?: unknown; error?: { message?: unknown } };
    if (typeof parsed.message === 'string' && parsed.message.length > 0) {
      return clampMessage(parsed.message);
    }
    if (typeof parsed.error?.message === 'string' && parsed.error.message.length > 0) {
      return clampMessage(parsed.error.message);
    }
    const d = parsed.detail;
    if (typeof d === 'string' && d.length > 0) {
      return clampMessage(d);
    }
    const validationMessage = parseValidationDetail(d);
    if (validationMessage) {
      return validationMessage;
    }
  } catch {
    /* ignore */
  }
  return GENERIC_HTTP_ERROR;
}

async function toApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  return new ApiError(parseHttpErrorMessage(text), response.status);
}

export async function apiFetchOk(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

export async function apiJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetchOk(path, options);
  return response.json() as Promise<T>;
}

export async function apiPostJson<T>(path: string, payload: unknown, options: ApiFetchOptions = {}): Promise<T> {
  return apiJson<T>(path, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: JSON.stringify(payload),
  });
}
