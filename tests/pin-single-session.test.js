import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('PIN Single Active Session & Kickout', () => {
  beforeEach(() => {
    process.env.PIN_SESSION_SECRET = 'test-secret-that-is-long-enough-0123456789';
  });

  it('signs and verifies session with sessionId', async () => {
    const { signPinSession, readPinSession } = await import('@/lib/auth/pinSession');
    const token = await signPinSession({
      pinId: 'pin-uuid-1',
      sportId: 'sport-uuid-1',
      label: 'Referee 1',
      sessionId: 'session-uuid-123',
    });

    const parsed = await readPinSession(token);
    expect(parsed.pinId).toBe('pin-uuid-1');
    expect(parsed.sportId).toBe('sport-uuid-1');
    expect(parsed.label).toBe('Referee 1');
    expect(parsed.sessionId).toBe('session-uuid-123');
  });

  it('rejects old session when active_session_id has been rotated (kicked out)', async () => {
    const { signPinSession } = await import('@/lib/auth/pinSession');
    const device1Token = await signPinSession({
      pinId: 'pin-uuid-1',
      sportId: 'sport-uuid-1',
      label: 'Ref 1',
      sessionId: 'device-1-session',
    });

    // Mock DB where active_session_id was rotated to device-2-session
    const mockDbPin = {
      id: 'pin-uuid-1',
      sport_id: 'sport-uuid-1',
      label: 'Ref 1',
      is_active: true,
      expires_at: null,
      active_session_id: 'device-2-session', // rotated!
      sports: { name: 'ฟุตซอล' },
    };

    vi.doMock('next/headers', () => ({
      cookies: async () => ({
        get: (name) => (name === 'sg_pin' ? { value: device1Token } : undefined),
      }),
    }));

    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabaseClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    }));

    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockDbPin }),
            }),
          }),
        }),
      }),
    }));

    const { resolveActorWithStatus, requireScorer } = await import('@/lib/auth/resolveActor');

    const status = await resolveActorWithStatus();
    expect(status.actor).toBeNull();
    expect(status.kicked).toBe(true);

    const guard = await requireScorer();
    expect(guard.actor).toBeUndefined();
    expect(guard.response).toBeDefined();
    expect(guard.response.status).toBe(401);

    const body = await guard.response.json();
    expect(body.error_code).toBe('SESSION_REPLACED');
    expect(body.message).toContain('ถูกเข้าสู่ระบบจากอุปกรณ์อื่น');
  });

  it('accepts session when active_session_id matches', async () => {
    vi.resetModules();
    const { signPinSession } = await import('@/lib/auth/pinSession');
    const activeSessionId = 'current-session-id';
    const activeToken = await signPinSession({
      pinId: 'pin-uuid-1',
      sportId: 'sport-uuid-1',
      label: 'Ref 1',
      sessionId: activeSessionId,
    });

    const mockDbPin = {
      id: 'pin-uuid-1',
      sport_id: 'sport-uuid-1',
      label: 'Ref 1',
      is_active: true,
      expires_at: null,
      active_session_id: activeSessionId,
      sports: { name: 'บาสเกตบอล' },
    };

    vi.doMock('next/headers', () => ({
      cookies: async () => ({
        get: (name) => (name === 'sg_pin' ? { value: activeToken } : undefined),
      }),
    }));

    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabaseClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    }));

    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockDbPin }),
            }),
          }),
        }),
      }),
    }));

    const { resolveActorWithStatus, requireScorer } = await import('@/lib/auth/resolveActor');

    const status = await resolveActorWithStatus();
    expect(status.actor).not.toBeNull();
    expect(status.actor.type).toBe('pin');
    expect(status.actor.sportName).toBe('บาสเกตบอล');
    expect(status.kicked).toBe(false);

    const guard = await requireScorer();
    expect(guard.actor).toEqual(status.actor);
    expect(guard.response).toBeUndefined();
  });
});
