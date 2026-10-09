import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => {} }),
}));
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
      type: 'staff',
      admin_user_id: 'u1',
      pin_id: null,
      label: 'Staff',
    });
    expect(actorToRpc({ type: 'pin', pinId: 'p1', label: 'PIN' })).toEqual({
      type: 'pin',
      admin_user_id: null,
      pin_id: 'p1',
      label: 'PIN',
    });
  });

  it('actorPublicView hides internal ids except adminUserId', async () => {
    const { actorPublicView } = await import('@/lib/auth/resolveActor');
    expect(actorPublicView({ type: 'pin', pinId: 'secret', label: 'PIN', sportIds: ['s'] })).toEqual({
      type: 'pin',
      label: 'PIN',
      sportIds: ['s'],
      sportName: null,
      adminUserId: null,
    });
    expect(actorPublicView(null)).toBeNull();
  });

  it('super_admin always takes precedence over PIN cookie in resolveActorWithStatus', async () => {
    vi.resetModules();
    process.env.PIN_SESSION_SECRET = 'test-secret-that-is-long-enough-0123456789';

    const { signPinSession } = await import('@/lib/auth/pinSession');
    const pinToken = await signPinSession({
      pinId: 'pin-123',
      sportId: 'sport-futsal',
      label: 'Futsal Ref',
      sessionId: 'sess-1',
    });

    vi.doMock('next/headers', () => ({
      cookies: async () => ({
        get: (name) => (name === 'sg_pin' ? { value: pinToken } : undefined),
      }),
    }));

    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabaseClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'auth-admin-1' } } }) },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'admin-uuid-1',
                  display_name: 'Super Admin',
                  role: 'super_admin',
                  staff_sport_assignments: [],
                },
              }),
            }),
          }),
        }),
      }),
    }));

    const { resolveActorWithStatus, requireScorerForSport, requireAdmin } =
      await import('@/lib/auth/resolveActor');

    const status = await resolveActorWithStatus();
    expect(status.actor).not.toBeNull();
    expect(status.actor.type).toBe('admin');
    expect(status.actor.sportIds).toBe('*');
    expect(status.actor.adminUserId).toBe('admin-uuid-1');

    // Super Admin can score ANY sport (e.g. Volleyball), even if PIN is for Futsal
    const guard = await requireScorerForSport('sport-volleyball');
    expect(guard.response).toBeUndefined();
    expect(guard.actor.type).toBe('admin');

    const adminGuard = await requireAdmin();
    expect(adminGuard.response).toBeUndefined();
    expect(adminGuard.actor.type).toBe('admin');
  });
});
