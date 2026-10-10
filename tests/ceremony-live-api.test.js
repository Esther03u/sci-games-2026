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
  it('returns placements, standings, and edge cache headers', async () => {
    const { GET } = await import('@/app/api/ceremony/live/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=5');
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.events.length).toBe(1);
    expect(body.data.standings[0].name).toBe('สีแดง');
    expect(body.data.timestamp).toBeTypeOf('number');
  });
});
