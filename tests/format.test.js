import { describe, expect, it } from 'vitest';
import {
  EVENT_DAYS,
  EVENT_START_DATE,
  fmtEventDay,
  fmtEventDayLong,
  fmtTime,
  fmtTimeTh,
  fmtPlace,
  fmtRemaining,
  relativeTime,
} from '@/lib/format';
import { ROUND_LABEL, roundLabel, EVENT_LABEL, MATCH_STATUS } from '@/lib/labels';

describe('format', () => {
  it('event day labels', () => {
    expect(EVENT_DAYS).toHaveLength(4);
    expect(EVENT_START_DATE).toBe('2026-10-08');
    expect(fmtEventDay('2026-10-08')).toBe('พฤ. 8 ต.ค.');
    expect(fmtEventDay('2026-10-09')).toBe('ศ. 9 ต.ค.');
    expect(fmtEventDay('2026-12-25')).toBe('12-25');
    expect(fmtEventDay(undefined)).toBe('');
    expect(fmtEventDayLong('2026-10-11')).toMatch(/อาทิตย์/);
    expect(fmtEventDayLong('x')).toBe('x');
  });

  it('time helpers', () => {
    expect(fmtTime('17:30:00')).toBe('17:30');
    expect(fmtTime(null)).toBe('');
    expect(fmtTimeTh('09:05:00')).toBe('09:05 น.');
  });

  it('fmtRemaining never goes negative', () => {
    expect(fmtRemaining(65000)).toBe('1:05');
    expect(fmtRemaining(0)).toBe('0:00');
    expect(fmtRemaining(-5000)).toBe('0:00');
  });

  it('relativeTime is null before the client clock starts (SSR safety)', () => {
    const now = Date.UTC(2026, 9, 9, 10, 0, 0);
    expect(relativeTime(new Date(now - 2000).toISOString(), 0)).toBeNull();
    expect(relativeTime(new Date(now - 2000).toISOString(), now)).toBe('เมื่อสักครู่');
    expect(relativeTime(new Date(now - 30_000).toISOString(), now)).toBe('30 วินาทีที่แล้ว');
    expect(relativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 นาทีที่แล้ว');
    expect(relativeTime(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe('3 ชั่วโมงที่แล้ว');
  });
});

describe('labels', () => {
  it('round labels fall back to the raw value', () => {
    expect(ROUND_LABEL.final).toBe('ชิงชนะเลิศ');
    expect(roundLabel('semi_1')).toBe('รอบรองฯ 1');
    expect(roundLabel('quarter')).toBe('quarter');
    expect(roundLabel(null)).toBe('');
  });

  it('covers every event type and match status the DB can emit', () => {
    for (const t of ['score', 'start', 'finish_set', 'finish_match', 'reopen', 'override', 'undo'])
      expect(EVENT_LABEL[t]).toBeTruthy();
    for (const s of ['upcoming', 'live', 'finished', 'postponed'])
      expect(MATCH_STATUS[s]?.label).toBeTruthy();
  });
});

describe('fmtPlace', () => {
  it('joins venue and court, falls back to the sport venue', () => {
    expect(fmtPlace({ venue: 'สนามเปตอง', court: 'สนาม 2' })).toBe('สนามเปตอง · สนาม 2');
    expect(fmtPlace({ venue: 'สนามฟุตซอล', court: null })).toBe('สนามฟุตซอล');
    expect(fmtPlace({ venue: '' }, 'โรงยิม')).toBe('โรงยิม');
    expect(fmtPlace(null)).toBe('');
  });
});
