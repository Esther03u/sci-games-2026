import { beforeEach, describe, expect, it } from 'vitest';

describe('pinSession', () => {
  beforeEach(() => {
    process.env.PIN_SESSION_SECRET = 'test-secret-that-is-long-enough-0123456789';
  });

  it('round-trips a signed session', async () => {
    const { signPinSession, readPinSession } = await import('@/lib/auth/pinSession');
    const token = await signPinSession({ pinId: 'pin-1', sportId: 'sport-1', label: 'กรรมการ 1' });
    const session = await readPinSession(token);
    expect(session).toEqual({ pinId: 'pin-1', sportId: 'sport-1', label: 'กรรมการ 1' });
  });

  it('rejects a tampered token', async () => {
    const { signPinSession, readPinSession } = await import('@/lib/auth/pinSession');
    const token = await signPinSession({ pinId: 'pin-1', sportId: 'sport-1', label: 'x' });
    const [h, p, s] = token.split('.');
    expect(await readPinSession(`${h}.${p}.${s.slice(0, -2)}xx`)).toBeNull();
    expect(await readPinSession('')).toBeNull();
    expect(await readPinSession(undefined)).toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const { signPinSession, readPinSession } = await import('@/lib/auth/pinSession');
    const token = await signPinSession({ pinId: 'pin-1', sportId: 'sport-1', label: 'x' });
    process.env.PIN_SESSION_SECRET = 'a-completely-different-secret-value-xyz';
    expect(await readPinSession(token)).toBeNull();
  });

  it('reports when the secret is missing or too short', async () => {
    const { pinSessionConfigured, signPinSession } = await import('@/lib/auth/pinSession');
    process.env.PIN_SESSION_SECRET = 'short';
    expect(pinSessionConfigured()).toBe(false);
    await expect(signPinSession({ pinId: 'a', sportId: 'b', label: 'c' })).rejects.toThrow(/PIN_SESSION_SECRET/);
  });
});
