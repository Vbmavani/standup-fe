import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, parseApiError, request } from './client';

describe('parseApiError', () => {
  it('reads the contract error shape', () => {
    const err = parseApiError(409, { error: { code: 'CONFLICT', message: 'Email already in use' } });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Email already in use');
  });

  it('falls back to a code from the status when the body is not the contract shape', () => {
    const err = parseApiError(404, 'Not Found', 'Not Found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Not Found');
    expect(parseApiError(502, undefined).code).toBe('INTERNAL');
    expect(parseApiError(502, undefined).message).toMatch(/something went wrong/i);
  });
});

describe('buildUrl', () => {
  it('prefixes /api and drops empty query params', () => {
    expect(buildUrl('/teams')).toBe('/api/teams');
    expect(buildUrl('/teams/1/standups', { date: '2026-10-16', x: undefined })).toBe(
      '/api/teams/1/standups?date=2026-10-16',
    );
  });
});

describe('request', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends JSON with credentials and parses the response', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ team: { id: 't1' } }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await request<{ team: { id: string } }>('POST', '/teams', { body: { name: 'Core' } });
    expect(res.team.id).toBe('t1');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/teams');
    expect(init.credentials).toBe('include');
    expect(init.body).toBe('{"name":"Core"}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    await expect(request('DELETE', '/teams/1/members/me')).resolves.toBeUndefined();
  });

  it('throws ApiError with server code and message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Owner cannot leave' } }), { status: 409 }),
      ),
    );
    await expect(request('DELETE', '/teams/1/members/me')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'CONFLICT',
      message: 'Owner cannot leave',
    });
  });

  it('maps network failures to a friendly ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    await expect(request('GET', '/auth/me')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
