import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/queries/podium', () => ({
  getPodiumSettings: async () => ({ status: 'countdown', revealed: false }),
}));

describe('GET /api/public/podium-settings', () => {
  it('is cached at the edge for 5 s so spectator polling reads Supabase at most every 5 s', async () => {
    const { GET } = await import('@/app/api/public/podium-settings/route');
    const res = await GET();
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=5');
    expect(await res.json()).toEqual({ success: true, data: { status: 'countdown', revealed: false } });
  });
});

describe('isPodiumRevealed', () => {
  it('treats a fast-forward as revealed (the admin button saves revealed: false)', async () => {
    const { isPodiumRevealed } = await import('@/lib/podium');
    expect(isPodiumRevealed({ status: 'fast_forward', revealed: false })).toBe(true);
    expect(isPodiumRevealed({ status: 'revealed' })).toBe(true);
    expect(isPodiumRevealed({ status: 'countdown', revealed: true })).toBe(true);
    expect(isPodiumRevealed({ status: 'countdown', revealed: false })).toBe(false);
    expect(isPodiumRevealed({ status: 'holding' })).toBe(false);
    expect(isPodiumRevealed(null)).toBe(false);
  });
});

describe('PodiumCountdown', () => {
  it('does not open a Supabase Realtime channel (free tier: 200 connections for the whole project)', () => {
    const src = readFileSync('src/components/public/PodiumCountdown.js', 'utf8');
    expect(src).not.toMatch(/supabase\/client|\.channel\(/);
  });
});
