import { describe, it, expect } from 'vitest';
import { haveMatchesChanged } from '../src/hooks/useLiveScores';

describe('haveMatchesChanged', () => {
  const m1 = {
    id: 'm1',
    status: 'upcoming',
    score_a: 0,
    score_b: 0,
    match_date: '2026-10-08',
    match_time: '17:00',
    court: '1',
    team_a_id: 't1',
    team_b_id: 't2',
  };
  const m2 = {
    id: 'm2',
    status: 'finished',
    score_a: 3,
    score_b: 1,
    match_date: '2026-10-08',
    match_time: '18:00',
    court: '1',
    team_a_id: 't3',
    team_b_id: 't4',
  };

  it('returns false when matches are identical', () => {
    const map = new Map([
      ['m1', { ...m1 }],
      ['m2', { ...m2 }],
    ]);
    const next = [{ ...m1 }, { ...m2 }];
    expect(haveMatchesChanged(map, next)).toBe(false);
  });

  it('returns true when a match score changes', () => {
    const map = new Map([
      ['m1', { ...m1 }],
      ['m2', { ...m2 }],
    ]);
    const next = [{ ...m1, score_a: 1 }, { ...m2 }];
    expect(haveMatchesChanged(map, next)).toBe(true);
  });

  it('returns true when match time or court changes', () => {
    const map = new Map([
      ['m1', { ...m1 }],
      ['m2', { ...m2 }],
    ]);
    const next = [{ ...m1, match_time: '17:30' }, { ...m2 }];
    expect(haveMatchesChanged(map, next)).toBe(true);
  });

  it('returns true when count of matches changes', () => {
    const map = new Map([['m1', { ...m1 }]]);
    const next = [{ ...m1 }, { ...m2 }];
    expect(haveMatchesChanged(map, next)).toBe(true);
  });
});
