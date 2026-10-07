import { describe, it, expect } from 'vitest';
import { haveMatchesChanged } from '@/hooks/useLiveScores';

describe('Schedule live refresh logic', () => {
  const m1 = {
    id: 'm1',
    sport_id: 'futsal',
    status: 'upcoming',
    match_date: '2026-10-08',
    match_time: '17:00',
    court: '1',
  };
  const m2 = {
    id: 'm2',
    sport_id: 'futsal',
    status: 'upcoming',
    match_date: '2026-10-08',
    match_time: '18:00',
    court: '1',
  };

  it('detects rescheduled match time', () => {
    const map = new Map([
      ['m1', { ...m1 }],
      ['m2', { ...m2 }],
    ]);
    const updatedMatches = [
      { ...m1, match_time: '17:30' },
      { ...m2 },
    ];
    expect(haveMatchesChanged(map, updatedMatches)).toBe(true);
  });

  it('detects court venue change', () => {
    const map = new Map([
      ['m1', { ...m1 }],
      ['m2', { ...m2 }],
    ]);
    const updatedMatches = [
      { ...m1 },
      { ...m2, court: '2' },
    ];
    expect(haveMatchesChanged(map, updatedMatches)).toBe(true);
  });

  it('detects match status progression from upcoming to live and finished', () => {
    const map = new Map([
      ['m1', { ...m1 }],
      ['m2', { ...m2 }],
    ]);
    const liveMatches = [
      { ...m1, status: 'live' },
      { ...m2 },
    ];
    expect(haveMatchesChanged(map, liveMatches)).toBe(true);

    const liveMap = new Map([
      ['m1', { ...m1, status: 'live' }],
      ['m2', { ...m2 }],
    ]);
    const finishedMatches = [
      { ...m1, status: 'finished', score_a: 2, score_b: 1 },
      { ...m2 },
    ];
    expect(haveMatchesChanged(liveMap, finishedMatches)).toBe(true);
  });
});
