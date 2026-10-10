// tests/ceremony-live-api.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { revealed: false, admin: null };

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({}),
}));

vi.mock('@/lib/auth/resolveActor', () => ({
  resolveAdminActor: async () => state.admin,
}));

vi.mock('@/lib/queries/placements', async (importOriginal) => ({
  // the real visibility rule, with made-up results
  visibleStandings: (await importOriginal()).visibleStandings,
  loadPlacements: async () => ({
    revealed: state.revealed,
    events: [{ key: 'futsal|ชาย', sport_name: 'ฟุตซอล', done: true, places: [] }],
    standings: [{ id: 'red', name: 'สีแดง', total_points: 80, rank: 1 }],
  }),
}));

vi.mock('@/lib/queries/core', () => ({
  getSports: async () => ({ data: [{ id: 'futsal', name: 'ฟุตซอล' }] }),
  getTeams: async () => ({ data: [{ id: 'red', name: 'สีแดง', color_hex: '#ef4444' }] }),
  rows: (r) => r?.data || [],
}));

beforeEach(() => {
  state.revealed = false;
  state.admin = null;
});

describe('GET /api/ceremony/live', () => {
  it('after the podium reveal: placements, standings, and edge cache headers with ETag', async () => {
    state.revealed = true;
    const { GET } = await import('@/app/api/ceremony/live/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=5');
    const etag = res.headers.get('etag');
    expect(etag).toMatch(/^W\/"[a-f0-9]+"$/);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.events.length).toBe(1);
    expect(body.data.standings[0].name).toBe('สีแดง');
    expect(body.data.timestamp).toBeTypeOf('number');
  });

  it('before the reveal, the public gets placements but no overall totals', async () => {
    const { GET } = await import('@/app/api/ceremony/live/route');
    const res = await GET();
    const body = await res.json();
    expect(body.data.events.length).toBe(1);
    expect(body.data.standings).toEqual([]);
    expect(JSON.stringify(body)).not.toContain('total_points');
    expect(res.headers.get('cache-control')).toContain('s-maxage=5');
  });

  it('before the reveal, a signed-in admin gets the totals in a private (uncached) response', async () => {
    state.admin = { type: 'admin' };
    const { GET } = await import('@/app/api/ceremony/live/route');
    const res = await GET();
    const body = await res.json();
    expect(body.data.standings[0].total_points).toBe(80);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('returns 304 Not Modified when If-None-Match matches current ETag', async () => {
    const { GET } = await import('@/app/api/ceremony/live/route');
    const firstRes = await GET();
    const etag = firstRes.headers.get('etag');
    expect(etag).toBeTruthy();

    const conditionalReq = new Request('http://localhost:3000/api/ceremony/live', {
      headers: {
        'if-none-match': etag,
      },
    });

    const secondRes = await GET(conditionalReq);
    expect(secondRes.status).toBe(304);
    expect(secondRes.headers.get('etag')).toBe(etag);
  });
});
