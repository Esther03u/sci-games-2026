import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => {} }) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({}) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }));

describe('actor helpers', () => {
  it('actorCanScoreSport: admin wildcard, staff list, pin single sport', async () => {
    const { actorCanScoreSport } = await import('@/lib/auth/resolveActor');
    expect(actorCanScoreSport({ type: 'admin', sportIds: '*' }, 'x')).toBe(true);
    expect(actorCanScoreSport({ type: 'staff', sportIds: ['a', 'b'] }, 'b')).toBe(true);
    expect(actorCanScoreSport({ type: 'staff', sportIds: ['a'] }, 'b')).toBe(false);
    expect(actorCanScoreSport({ type: 'pin', sportIds: ['s'] }, 's')).toBe(true);
    expect(actorCanScoreSport(null, 's')).toBe(false);
  });

  it('actorToRpc produces the p_actor shape expected by migration 002', async () => {
    const { actorToRpc } = await import('@/lib/auth/resolveActor');
    expect(actorToRpc({ type: 'staff', adminUserId: 'u1', label: 'Staff' })).toEqual({
      type: 'staff', admin_user_id: 'u1', pin_id: null, label: 'Staff',
    });
    expect(actorToRpc({ type: 'pin', pinId: 'p1', label: 'PIN' })).toEqual({
      type: 'pin', admin_user_id: null, pin_id: 'p1', label: 'PIN',
    });
  });

  it('actorPublicView hides internal ids except adminUserId', async () => {
    const { actorPublicView } = await import('@/lib/auth/resolveActor');
    expect(actorPublicView({ type: 'pin', pinId: 'secret', label: 'PIN', sportIds: ['s'] })).toEqual({
      type: 'pin', label: 'PIN', sportIds: ['s'], adminUserId: null,
    });
    expect(actorPublicView(null)).toBeNull();
  });
});
