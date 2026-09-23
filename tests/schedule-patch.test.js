import { describe, expect, it } from 'vitest';
import { schedulePatch } from '@/lib/schedule-patch';

const match = {
  id: 'x',
  team_a_id: 'red',
  team_b_id: 'blue',
  match_date: '2026-10-09',
  match_time: '17:30:00',
  venue: 'สนามเปตอง',
  court: 'สนาม 1',
};
const form = (over = {}) => ({
  team_a_id: 'red',
  team_b_id: 'blue',
  match_date: '2026-10-09',
  match_time: '17:30',
  venue: 'สนามเปตอง',
  court: 'สนาม 1',
  ...over,
});

describe('schedulePatch (admin แก้ตาราง)', () => {
  it('untouched form → empty patch (HH:MM equals stored HH:MM:SS)', () => {
    expect(schedulePatch(match, form())).toEqual({ patch: {} });
  });

  it('sends only the changed fields, time normalised to HH:MM:SS', () => {
    expect(schedulePatch(match, form({ match_time: '18:00', court: 'สนาม 3' }))).toEqual({
      patch: { match_time: '18:00:00', court: 'สนาม 3' },
    });
  });

  it('blank team / court become null; venue is trimmed', () => {
    expect(schedulePatch(match, form({ team_b_id: '', court: '  ', venue: ' สนามใหม่ ' }))).toEqual({
      patch: { team_b_id: null, venue: 'สนามใหม่', court: null },
    });
  });

  it('a court on a match that had none is sent', () => {
    expect(schedulePatch({ ...match, court: null }, form({ court: 'สนาม 2' })).patch).toEqual({
      court: 'สนาม 2',
    });
  });

  it('rejects the same team twice and an empty venue', () => {
    expect(schedulePatch(match, form({ team_b_id: 'red' })).error).toMatch(/ทีมเดียวกัน/);
    expect(schedulePatch(match, form({ venue: '   ' })).error).toMatch(/สถานที่/);
  });
});
