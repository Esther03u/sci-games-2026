// tests/ceremony-live-api.test.js
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({}),
}));

vi.mock('@/lib/queries/placements', () => ({
  loadPlacements: async () => ({
    events: [{ key: 'futsal|ชาย', sport_name: 'ฟุตซอล', done: true, places: [] }],
    standings: [{ id: 'red', name: 'สีแดง', total_points: 80, rank: 1 }],
  }),
}));

vi.mock('@/lib/queries/core', () => ({
  getSports: async () => ({ data: [{ id: 'futsal', name: 'ฟุตซอล' }] }),
  getTeams: async () => ({ data: [{ id: 'red', name: 'สีแดง', color_hex: '#ef4444' }] }),
  rows: (r) => r?.data || [],
}));

describe('GET /api/ceremony/live', () => {
  it('returns placements, standings, and edge cache headers with ETag', async () => {
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
