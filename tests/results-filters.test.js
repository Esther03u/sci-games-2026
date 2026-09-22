import { describe, expect, it } from 'vitest';
import {
  filterMatches,
  groupByStatus,
  isSport,
  nextUpcoming,
  sortChrono,
  sportOf,
  statusCounts,
} from '@/components/public/results/filters';

const sports = [
  { id: 'sport-futsal', name: 'ฟุตซอล', sort_order: 1 },
  { id: 'sport-volleyball', name: 'วอลเลย์บอล', sort_order: 2 },
];
const M = (id, o) => ({ id, match_date: '2026-10-09', match_time: '09:00', status: 'upcoming', ...o });
const matches = [
  M('f1', { sport_id: 'sport-futsal', status: 'finished', category: 'ชาย', match_number: 1 }),
  M('l1', { sport_id: 'sport-futsal', status: 'live', category: 'หญิง', match_time: '10:00' }),
  M('u2', { sport_id: 'sport-futsal', match_date: '2026-10-10', category: 'ชาย', match_number: 2 }),
  M('u1', { sport_id: 'sport-futsal', match_date: '2026-10-10', category: 'ชาย', match_number: 1 }),
  M('v1', { sport_id: 'sport-volleyball', match_time: '11:00', category: 'ผสม' }),
  M('p1', { sport_id: 'sport-volleyball', status: 'postponed', match_date: '2026-10-11', category: 'ชาย' }),
];

describe('results filters', () => {
  it('isSport matches "all" or the exact id', () => {
    expect(isSport({ sport_id: 'abc' }, 'all')).toBe(true);
    expect(isSport({ sport_id: 'sport-futsal' }, 'sport-futsal')).toBe(true);
    expect(isSport({ sport_id: 'sport-futsal' }, 'futsal')).toBe(false);
    expect(isSport({ sport_id: null }, 'futsal')).toBe(false);
    expect(sportOf(sports, { sport_id: 'sport-volleyball' })?.name).toBe('วอลเลย์บอล');
  });

  it('sortChrono orders by date, time, then match_number without mutating', () => {
    const input = [matches[2], matches[3], matches[1], matches[0]];
    const out = sortChrono(input);
    expect(out.map((m) => m.id)).toEqual(['f1', 'l1', 'u1', 'u2']);
    expect(input[0].id).toBe('u2');
  });

  it('filterMatches applies sport + status + category; upcoming includes postponed', () => {
    expect(filterMatches(matches, { sport: 'all', status: 'all', category: 'all' }).map((m) => m.id)).toEqual(
      ['f1', 'l1', 'v1', 'u1', 'u2', 'p1']
    );
    expect(filterMatches(matches, { status: 'upcoming' }).map((m) => m.id)).toEqual(['v1', 'u1', 'u2', 'p1']);
    expect(filterMatches(matches, { sport: 'sport-volleyball', category: 'ชาย' }).map((m) => m.id)).toEqual([
      'p1',
    ]);
    expect(filterMatches(matches, { status: 'live', category: 'ชาย' })).toEqual([]);
  });

  it('groupByStatus splits a filtered list', () => {
    const g = groupByStatus(filterMatches(matches, {}));
    expect(g.live.map((m) => m.id)).toEqual(['l1']);
    expect(g.finished.map((m) => m.id)).toEqual(['f1']);
    expect(g.upcoming.map((m) => m.id)).toEqual(['v1', 'u1', 'u2', 'p1']);
  });

  it('nextUpcoming: one per sport when "all", ordered by time then sort_order', () => {
    const upcoming = groupByStatus(filterMatches(matches, {})).upcoming;
    expect(nextUpcoming(upcoming, { sport: 'all', sports }).map((m) => m.id)).toEqual(['v1', 'u1']);
    expect(nextUpcoming(upcoming, { sport: 'sport-futsal', sports }).map((m) => m.id)).toEqual(['u1']);
    expect(nextUpcoming([], { sport: 'all', sports })).toEqual([]);
  });

  it('statusCounts ignores the status filter but honours sport/category', () => {
    expect(statusCounts(matches, { sport: 'all', category: 'all' })).toEqual({
      all: 6,
      finished: 1,
      live: 1,
      upcoming: 4,
    });
    expect(statusCounts(matches, { sport: 'sport-futsal', category: 'ชาย' })).toEqual({
      all: 3,
      finished: 1,
      live: 0,
      upcoming: 2,
    });
  });
});
