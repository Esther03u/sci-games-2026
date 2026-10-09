import { describe, expect, it } from 'vitest';
import { normalizePathname } from '@/hooks/useSitePathname';

describe('normalizePathname', () => {
  it('maps the ISR "/index" home path to "/" so the server matches the browser', () => {
    expect(normalizePathname('/index')).toBe('/');
  });
  it('leaves every other path alone', () => {
    for (const p of ['/', '/schedule', '/index/x', '/admin', '/live/abc'])
      expect(normalizePathname(p)).toBe(p);
  });
});
