import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiError, NetworkError } from '@/lib/api/client';

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns data from a successful envelope and POSTs JSON by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: 1 } }));
    vi.stubGlobal('fetch', fetchMock);
    const data = await apiRequest('/api/x', { body: { a: 1 } });
    expect(data).toEqual({ id: 1 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('throws ApiError with the Thai message and code on { success:false }', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: false, error_code: 'EDIT_WINDOW_CLOSED', message: 'หมดเวลา' }, 409)
        )
    );
    const err = await apiRequest('/api/score').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('หมดเวลา');
    expect(err.code).toBe('EDIT_WINDOW_CLOSED');
    expect(err.status).toBe(409);
  });

  it('throws NetworkError when fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/api/score')).rejects.toBeInstanceOf(NetworkError);
  });

  it('GET sends no body or content-type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest('/api/admin/pins', { method: 'GET' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeUndefined();
    expect(init.headers).toBeUndefined();
  });
});
