import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }));

describe('mapRpcError', () => {
  it('maps a RAISE code prefix to status + Thai message', async () => {
    const { mapRpcError } = await import('@/lib/api/scoring');
    const r = mapRpcError({ message: 'EDIT_WINDOW_CLOSED: match finished more than 10 minutes ago' });
    expect(r.status).toBe(409);
    expect(r.body.error_code).toBe('EDIT_WINDOW_CLOSED');
    expect(r.body.success).toBe(false);
    expect(r.body.message).toMatch(/หมดเวลา/);
  });

  it('maps admin-only and not-found codes', async () => {
    const { mapRpcError } = await import('@/lib/api/scoring');
    expect(mapRpcError({ message: 'ADMIN_ONLY' }).status).toBe(403);
    expect(mapRpcError({ message: 'MATCH_NOT_FOUND' }).status).toBe(404);
    expect(mapRpcError({ message: 'SET_IS_TIED' }).body.error_code).toBe('SET_IS_TIED');
  });

  it('falls back to 500 RPC_ERROR for unknown messages', async () => {
    const { mapRpcError } = await import('@/lib/api/scoring');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = mapRpcError({ message: 'something unexpected' });
    expect(r.status).toBe(500);
    expect(r.body.error_code).toBe('RPC_ERROR');
    spy.mockRestore();
  });

  it('isUuid accepts v4 uuids only', async () => {
    const { isUuid } = await import('@/lib/api/scoring');
    expect(isUuid('a1111111-1111-1111-1111-111111111111')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});
