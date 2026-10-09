import { describe, expect, it } from 'vitest';
import { claimPageView, getVisitorId, shouldTrack, TRACK_WINDOW_MS } from '@/lib/page-tracking';
import { generateVisitorHash, isValidVisitorId, visitorHashFor } from '@/lib/analytics';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    data,
  };
}

const blocked = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('SecurityError');
  },
};

describe('shouldTrack', () => {
  it('counts a path once per window, then again after it', () => {
    const first = shouldTrack({}, '/', 1000);
    expect(first.track).toBe(true);
    expect(shouldTrack(first.seen, '/', 1000 + TRACK_WINDOW_MS - 1).track).toBe(false);
    expect(shouldTrack(first.seen, '/', 1000 + TRACK_WINDOW_MS).track).toBe(true);
  });

  it('tracks other paths independently and drops expired entries', () => {
    const { seen } = shouldTrack({ '/old': 0, '/': 5 }, '/results', TRACK_WINDOW_MS + 1);
    expect(seen).toEqual({ '/': 5, '/results': TRACK_WINDOW_MS + 1 });
  });

  it('a clock that went backwards does not suppress counting', () => {
    expect(shouldTrack({ '/': 5000 }, '/', 1000).track).toBe(true);
  });
});

describe('claimPageView', () => {
  it('refresh of the same page in the same tab is not counted again', () => {
    const s = memoryStorage();
    expect(claimPageView(s, '/', 0)).toBe(true);
    expect(claimPageView(s, '/', 10_000)).toBe(false);
    expect(claimPageView(s, '/schedule', 10_000)).toBe(true);
  });

  it('corrupt or blocked storage still counts the view', () => {
    expect(claimPageView(memoryStorage({ sg_seen: '{nope' }), '/', 0)).toBe(true);
    expect(claimPageView(blocked, '/', 0)).toBe(true);
  });
});

describe('getVisitorId', () => {
  it('creates one id and keeps it', () => {
    const s = memoryStorage();
    const id = getVisitorId(s);
    expect(isValidVisitorId(id)).toBe(true);
    expect(getVisitorId(s)).toBe(id);
  });

  it('returns null when storage is blocked', () => {
    expect(getVisitorId(blocked)).toBe(null);
  });
});

describe('visitorHashFor', () => {
  const ip = '1.2.3.4';
  const ua = 'Mozilla/5.0 (iPhone)';

  it('two browsers behind one Wi-Fi with the same phone are different visitors', () => {
    const a = visitorHashFor({ visitorId: '11111111-aaaa-bbbb-cccc-000000000001', ip, userAgent: ua });
    const b = visitorHashFor({ visitorId: '11111111-aaaa-bbbb-cccc-000000000002', ip, userAgent: ua });
    expect(a).not.toBe(b);
    expect(a).toMatch(/^v[0-9a-f]{16}$/);
  });

  it('same id is the same visitor even if the IP changes (mobile data ↔ Wi-Fi)', () => {
    const id = '11111111-aaaa-bbbb-cccc-000000000001';
    expect(visitorHashFor({ visitorId: id, ip, userAgent: ua })).toBe(
      visitorHashFor({ visitorId: id, ip: '5.6.7.8', userAgent: ua })
    );
  });

  it('falls back to the IP + user-agent hash without a valid id', () => {
    const legacy = generateVisitorHash(ip, ua);
    expect(visitorHashFor({ visitorId: null, ip, userAgent: ua })).toBe(legacy);
    expect(visitorHashFor({ visitorId: 'bad id!', ip, userAgent: ua })).toBe(legacy);
    expect(visitorHashFor({ visitorId: 'x'.repeat(65), ip, userAgent: ua })).toBe(legacy);
  });
});
