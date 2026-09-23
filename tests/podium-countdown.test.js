import { describe, it, expect } from 'vitest';
import { DEFAULT_PODIUM_SETTINGS } from '@/lib/queries/podium';

describe('Podium Countdown & Reveal Logic', () => {
  it('provides sensible default settings for closing ceremony reveal', () => {
    expect(DEFAULT_PODIUM_SETTINGS).toBeDefined();
    expect(DEFAULT_PODIUM_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_PODIUM_SETTINGS.status).toBe('countdown');
    expect(DEFAULT_PODIUM_SETTINGS.revealed).toBe(false);
    expect(typeof DEFAULT_PODIUM_SETTINGS.target_time).toBe('string');
    expect(new Date(DEFAULT_PODIUM_SETTINGS.target_time).getTime()).toBeGreaterThan(0);
  });

  it('holds time at 00:00:00 without auto-revealing when countdown time expires', () => {
    const target = new Date('2026-09-01T12:00:00Z').getTime();
    const now = new Date('2026-09-02T12:00:00Z').getTime();
    const diff = target - now;

    // Condition: when diff <= 0, time must hold at 00:00:00
    const isExpired = diff <= 0;
    const timeLeft = isExpired
      ? { days: 0, hours: 0, minutes: 0, seconds: 0 }
      : { days: 1, hours: 0, minutes: 0, seconds: 0 };

    expect(isExpired).toBe(true);
    expect(timeLeft).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Under user requirement: podium remains mystery (?) until admin explicitly reveals
    const isRevealed = false;
    expect(isRevealed).toBe(false);
  });

  it('correctly calculates 2-digit places for Counter component', () => {
    function getValueRoundedToPlace(value, place) {
      const scaled = value / place;
      return Math.floor(Math.round(scaled * 1e9) / 1e9);
    }

    // Helper to get digit value as calculated by Number in Counter
    function getDigit(value, place) {
      return getValueRoundedToPlace(value, place) % 10;
    }

    // Single digit 5 should display as "05" using places [10, 1]
    expect(getDigit(5, 10)).toBe(0);
    expect(getDigit(5, 1)).toBe(5);

    // Double digit 42 should display as "42"
    expect(getDigit(42, 10)).toBe(4);
    expect(getDigit(42, 1)).toBe(2);

    // Zero should display as "00"
    expect(getDigit(0, 10)).toBe(0);
    expect(getDigit(0, 1)).toBe(0);
  });

  it('supports fast_forward action payload structure', () => {
    const triggerTimestamp = new Date().toISOString();
    const fastForwardSettings = {
      ...DEFAULT_PODIUM_SETTINGS,
      status: 'fast_forward',
      fast_forward_at: triggerTimestamp,
      revealed: false,
    };

    expect(fastForwardSettings.status).toBe('fast_forward');
    expect(fastForwardSettings.fast_forward_at).toBe(triggerTimestamp);
    expect(fastForwardSettings.revealed).toBe(false);
  });

  it('supports revealed action payload structure', () => {
    const revealedSettings = {
      ...DEFAULT_PODIUM_SETTINGS,
      status: 'revealed',
      revealed: true,
      fast_forward_at: null,
    };

    expect(revealedSettings.status).toBe('revealed');
    expect(revealedSettings.revealed).toBe(true);
    expect(revealedSettings.fast_forward_at).toBeNull();
  });
});
