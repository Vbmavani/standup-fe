export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

const FALLBACK_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

/** Turn a non-OK response body (already parsed or raw text) into an ApiError. */
export function parseApiError(status: number, body: unknown, statusText = ''): ApiError {
  if (body && typeof body === 'object' && 'error' in body) {
    const e = (body as { error: unknown }).error;
    if (e && typeof e === 'object') {
      const { code, message } = e as { code?: unknown; message?: unknown };
      return new ApiError(
        status,
        typeof code === 'string' ? code : (FALLBACK_CODES[status] ?? 'INTERNAL'),
        typeof message === 'string' && message ? message : statusText || 'Request failed',
      );
    }
  }
  const code = FALLBACK_CODES[status] ?? 'INTERNAL';
  const message =
    status >= 500 || status === 0 ? 'Something went wrong. Please try again.' : statusText || 'Request failed';
  return new ApiError(status, code, message);
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

export function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = '/api' + (path.startsWith('/') ? path : '/' + path);
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body,
      credentials: 'include',
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the API running?');
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) throw parseApiError(res.status, data, res.statusText);
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
