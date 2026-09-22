import { describe, expect, it } from 'vitest';
import { groupSets, latestByMatch, matchWinner, matchesForSport } from '@/hooks/useLiveScores';

describe('live helpers', () => {
  it('matchesForSport: splits by status, finished newest first, other sports ignored', () => {
    const matches = [
      { id: 'u1', sport_id: 's1', status: 'upcoming' },
      { id: 'f-old', sport_id: 's1', status: 'finished', finished_at: '2026-10-09T10:00:00Z' },
      { id: 'l1', sport_id: 's1', status: 'live' },
      { id: 'x', sport_id: 's2', status: 'live' },
      { id: 'f-new', sport_id: 's1', status: 'finished', finished_at: '2026-10-09T12:00:00Z' },
      { id: 'p1', sport_id: 's1', status: 'postponed' },
    ];
    const g = matchesForSport(matches, 's1');
    expect(g.live.map((m) => m.id)).toEqual(['l1']);
    expect(g.upcoming.map((m) => m.id)).toEqual(['u1', 'p1']); // input order kept
    expect(g.finished.map((m) => m.id)).toEqual(['f-new', 'f-old']);
    expect(matchesForSport(matches, 'nope')).toEqual({ live: [], upcoming: [], finished: [] });
  });

  it('matchWinner: points vs sets scoring, only for finished matches', () => {
    const points = { scoring_type: 'points' };
    const sets = { scoring_type: 'sets' };
    expect(matchWinner({ status: 'finished', score_a: 3, score_b: 1 }, points)).toBe('a');
    expect(matchWinner({ status: 'finished', score_a: 0, score_b: 2 }, points)).toBe('b');
    expect(matchWinner({ status: 'finished', score_a: 2, score_b: 2 }, points)).toBeNull();
    // sets sport: sets_* decide even when points favour the other side
    expect(matchWinner({ status: 'finished', sets_a: 1, sets_b: 2, score_a: 50, score_b: 40 }, sets)).toBe(
      'b'
    );
    expect(matchWinner({ status: 'live', score_a: 9, score_b: 0 }, points)).toBeNull();
    expect(matchWinner(null, points)).toBeNull();
    expect(matchWinner({ status: 'finished', score_a: 1, score_b: 0 }, undefined)).toBe('a');
  });

  it('latestByMatch keeps the first (newest) event per match', () => {
    const rows = [
      { id: 'e3', match_id: 'm1', delta: 1 },
      { id: 'e2', match_id: 'm2', delta: 1 },
      { id: 'e1', match_id: 'm1', delta: -1 },
    ];
    expect(latestByMatch(rows)).toEqual({ m1: rows[0], m2: rows[1] });
    expect(latestByMatch([])).toEqual({});
  });

  it('groupSets groups by match and sorts by set_number', () => {
    const rows = [
      { id: 'a', match_id: 'm1', set_number: 2 },
      { id: 'b', match_id: 'm2', set_number: 1 },
      { id: 'c', match_id: 'm1', set_number: 1 },
    ];
    const g = groupSets(rows);
    expect(g.m1.map((s) => s.set_number)).toEqual([1, 2]);
    expect(g.m2.map((s) => s.id)).toEqual(['b']);
  });
});
