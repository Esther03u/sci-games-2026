import { describe, expect, it } from 'vitest';
import { filterSchedule, findSportFor, groupBySport, groupByTime, timeSlotLabel } from '@/lib/schedule-grid';

const sports = [
  { id: 'futsal', name: 'ฟุตซอล', sort_order: 1 },
  { id: 'volley', name: 'วอลเลย์บอล', sort_order: 2 },
];
const m = (id, sport_id, match_date, match_time, extra = {}) => ({
  id,
  sport_id,
  match_date,
  match_time,
  ...extra,
});
const matches = [
  m('v1', 'volley', '2026-10-09', '17:30:00', { category: 'ชาย', match_number: 1 }),
  m('f2', 'futsal', '2026-10-09', '17:30:00', { category: 'หญิง', match_number: 2 }),
  m('f1', 'futsal', '2026-10-08', '18:30:00', { category: 'ชาย', match_number: 1 }),
  m('x1', 'unknown', '2026-10-10', null, { category: 'คู่ผสม' }),
  m('f3', 'futsal-legacy-seed', '2026-10-10', '10:00:00', { category: 'ชาย' }),
];

describe('filterSchedule', () => {
  it('filters by day, sport (incl. legacy ids containing the sport id) and category', () => {
    expect(filterSchedule(matches).length).toBe(5);
    expect(filterSchedule(matches, { day: '2026-10-09' }).map((x) => x.id)).toEqual(['v1', 'f2']);
    expect(filterSchedule(matches, { sport: 'futsal' }).map((x) => x.id)).toEqual(['f2', 'f1', 'f3']);
    expect(filterSchedule(matches, { category: 'ผสม' }).map((x) => x.id)).toEqual(['x1']);
    expect(filterSchedule(matches, { sport: 'volley', category: 'หญิง' })).toEqual([]);
  });
});

describe('findSportFor / timeSlotLabel', () => {
  it('matches exact and legacy ids', () => {
    expect(findSportFor(matches[4], sports).id).toBe('futsal');
    expect(findSportFor(matches[3], sports)).toBeUndefined();
  });
  it('labels a slot by time_display, HH:MM or "ไม่ระบุเวลา"', () => {
    expect(timeSlotLabel({ match_time: '17:30:00' })).toBe('17:30 น.');
    expect(timeSlotLabel({ time_display: '09:00-10:00 น.', match_time: '09:00:00' })).toBe('09:00-10:00 น.');
    expect(timeSlotLabel({})).toBe('ไม่ระบุเวลา');
  });
});

describe('groupByTime', () => {
  it('groups by date then time slot; same slot ordered by sport sort_order', () => {
    const g = groupByTime(matches, sports);
    expect(Object.keys(g)).toEqual(['2026-10-08', '2026-10-09', '2026-10-10']);
    expect(g['2026-10-09'].totalMatches).toBe(2);
    expect(g['2026-10-09'].timeSlots['17:30 น.'].map((x) => x.id)).toEqual(['f2', 'v1']);
    expect(Object.keys(g['2026-10-10'].timeSlots)).toEqual(['ไม่ระบุเวลา', '10:00 น.']);
  });
});

describe('groupBySport', () => {
  it('groups in sports order, unknown sports last, dates in order', () => {
    const g = groupBySport(matches, sports);
    expect(g.map((x) => x.sport?.id ?? null)).toEqual(['futsal', 'volley', null]);
    expect(g[0].total).toBe(3);
    expect(Object.keys(g[0].dates)).toEqual(['2026-10-08', '2026-10-09', '2026-10-10']);
    expect(g[2].dates['2026-10-10'].map((x) => x.id)).toEqual(['x1']);
  });
  it('drops sports without matches', () => {
    expect(groupBySport([matches[0]], sports).map((x) => x.sport.id)).toEqual(['volley']);
  });
});
