import { describe, expect, it } from 'vitest';
import { formatTyping, parseTime, toFieldValue } from '@/lib/time-input';

describe('parseTime', () => {
  it('accepts 24-hour times in the usual ways people type them', () => {
    expect(parseTime('19:00')).toBe('19:00');
    expect(parseTime('1900')).toBe('19:00');
    expect(parseTime('19.00')).toBe('19:00');
    expect(parseTime('9:30')).toBe('09:30');
    expect(parseTime('930')).toBe('09:30');
    expect(parseTime('9')).toBe('09:00');
    expect(parseTime('19')).toBe('19:00');
    expect(parseTime('19:3')).toBe('19:30');
    expect(parseTime(' 00:05 ')).toBe('00:05');
    expect(parseTime('23:59')).toBe('23:59');
  });

  it('rejects impossible or non-time input', () => {
    for (const bad of ['', '24:00', '19:60', '2500', 'abc', '7pm', '1:2:3', '12345']) {
      expect(parseTime(bad)).toBe(null);
    }
  });
});

describe('formatTyping', () => {
  it('inserts the colon after the hour while typing', () => {
    expect(formatTyping('1')).toBe('1');
    expect(formatTyping('19')).toBe('19');
    expect(formatTyping('190')).toBe('19:0');
    expect(formatTyping('1900')).toBe('19:00');
    expect(formatTyping('19000')).toBe('19:00');
    expect(formatTyping('19:00')).toBe('19:00');
    expect(formatTyping('9:3')).toBe('9:3');
    expect(formatTyping('a1b9')).toBe('19');
  });

  it('a first digit of 3–9 is a one-digit hour', () => {
    expect(formatTyping('9')).toBe('9');
    expect(formatTyping('93')).toBe('09:3');
    expect(formatTyping('930')).toBe('09:30');
    expect(formatTyping('9300')).toBe('09:30');
    expect(formatTyping('25')).toBe('25'); // not guessed — flagged as invalid
    expect(parseTime(formatTyping('930'))).toBe('09:30');
  });
});

describe('toFieldValue', () => {
  it('drops seconds from database values', () => {
    expect(toFieldValue('18:30:00')).toBe('18:30');
    expect(toFieldValue('')).toBe('');
    expect(toFieldValue(null)).toBe('');
  });
});
