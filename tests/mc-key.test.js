// tests/mc-key.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isValidMcKey, mcAccessKey } from '@/lib/auth/mcKey';

const saved = process.env.PIN_SESSION_SECRET;

beforeEach(() => {
  process.env.PIN_SESSION_SECRET = 'test-secret-at-least-16-chars';
});
afterEach(() => {
  process.env.PIN_SESSION_SECRET = saved;
});

describe('MC secret link key', () => {
  it('is stable, URL-safe and accepted', () => {
    const key = mcAccessKey();
    expect(key).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(mcAccessKey()).toBe(key);
    expect(isValidMcKey(key)).toBe(true);
  });

  it('rejects wrong, missing and non-string keys', () => {
    const key = mcAccessKey();
    expect(isValidMcKey(`${key.slice(0, -1)}${key.endsWith('A') ? 'B' : 'A'}`)).toBe(false);
    expect(isValidMcKey(key.slice(1))).toBe(false);
    expect(isValidMcKey('')).toBe(false);
    expect(isValidMcKey(undefined)).toBe(false);
    expect(isValidMcKey([key])).toBe(false);
  });

  it('changes with the secret and is off without one', () => {
    const key = mcAccessKey();
    process.env.PIN_SESSION_SECRET = 'another-secret-16-chars-long';
    expect(mcAccessKey()).not.toBe(key);
    expect(isValidMcKey(key)).toBe(false);
    delete process.env.PIN_SESSION_SECRET;
    expect(mcAccessKey()).toBeNull();
    expect(isValidMcKey(key)).toBe(false);
  });
});
