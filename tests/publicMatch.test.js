import { describe, expect, it } from 'vitest';
import { maskLiveMatch } from '@/lib/api/publicMatch';

const live = {
  id: 'm1',
  status: 'live',
  score_a: 7,
  score_b: 3,
  sets_a: 1,
  sets_b: 0,
  current_set: 2,
  last_score_at: '2026-10-09T10:00:00Z',
  last_scored_team: 'a',
  venue: 'สนาม 1',
  match_time: '09:00',
  match_sets: [{ set_number: 1, score_a: 25, score_b: 20, status: 'finished' }],
};

describe('maskLiveMatch', () => {
  it('preserves live scores and sets for real-time spectator view', () => {
    const m = maskLiveMatch(live);
    expect(m.status).toBe('live');
    expect(m.score_a).toBe(7);
    expect(m.score_b).toBe(3);
    expect(m.sets_a).toBe(1);
    expect(m.sets_b).toBe(0);
    expect(m.current_set).toBe(2);
    expect(m.match_sets).toEqual(live.match_sets);
  });

  it('keeps the schedule fields a spectator needs', () => {
    const m = maskLiveMatch(live);
    expect(m.venue).toBe('สนาม 1');
    expect(m.match_time).toBe('09:00');
    expect(m.id).toBe('m1');
  });

  it('leaves finished, upcoming and postponed matches untouched', () => {
    for (const status of ['finished', 'upcoming', 'postponed']) {
      const row = { ...live, status };
      expect(maskLiveMatch(row)).toBe(row);
    }
  });

  it('does not mutate its input and tolerates empty values', () => {
    const copy = { ...live };
    maskLiveMatch(live);
    expect(live).toEqual(copy);
    expect(maskLiveMatch(null)).toBeNull();
    expect(maskLiveMatch({ status: 'live' }).match_sets).toBeUndefined();
  });
});
