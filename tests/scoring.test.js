import { describe, expect, it } from 'vitest';
import { editDeadline, groupMatches, projectedSets, projectedWinner, winnerText } from '@/components/staff/ScoreInput/scoring';
import { applyOptimistic, mergeServerRow } from '@/hooks/useScoreQueue';
import { hasScoreChange } from '@/hooks/useMatchSync';

const T0 = Date.UTC(2026, 9, 9, 10, 0, 0);
const iso = (ms) => new Date(ms).toISOString();

describe('scoring helpers', () => {
  it('editDeadline is finished_at + window', () => {
    expect(editDeadline({ finished_at: iso(T0) }, 10).getTime()).toBe(T0 + 10 * 60000);
    expect(editDeadline({ status: 'live' }, 10)).toBeNull();
  });

  it('groupMatches: live / upcoming / recent (within window unless admin)', () => {
    const matches = [
      { id: 'l', status: 'live' },
      { id: 'u', status: 'upcoming' },
      { id: 'p', status: 'postponed' },
      { id: 'f-new', status: 'finished', finished_at: iso(T0 - 2 * 60000) },
      { id: 'f-old', status: 'finished', finished_at: iso(T0 - 30 * 60000) },
    ];
    const g = groupMatches(matches, { editWindowMinutes: 10, now: T0, isAdmin: false });
    expect(g.live.map((m) => m.id)).toEqual(['l']);
    expect(g.upcoming.map((m) => m.id)).toEqual(['u', 'p']);
    expect(g.recent.map((m) => m.id)).toEqual(['f-new']);
    const ga = groupMatches(matches, { editWindowMinutes: 10, now: T0, isAdmin: true });
    expect(ga.recent.map((m) => m.id)).toEqual(['f-new', 'f-old']); // newest first
  });

  it('projectedSets adds the open set to its leader', () => {
    expect(projectedSets({ sets_a: 1, sets_b: 0, score_a: 0, score_b: 2 })).toEqual({ a: 1, b: 1 });
    expect(projectedSets({ sets_a: 1, sets_b: 1, score_a: 15, score_b: 10 })).toEqual({ a: 2, b: 1 });
    expect(projectedSets({ sets_a: 1, sets_b: 0, score_a: 3, score_b: 3 })).toEqual({ a: 1, b: 0 });
  });

  it('projectedWinner / winnerText follow sets for set sports and points otherwise', () => {
    const sets = { scoring_type: 'sets', win_points: 3, lose_points: 0 };
    const pts = { scoring_type: 'points' };
    expect(projectedWinner({ sets_a: 1, sets_b: 0, score_a: 0, score_b: 2 }, sets)).toBeNull(); // 1-1 after auto-close
    expect(projectedWinner({ score_a: 2, score_b: 1 }, pts)).toBe('a');
    expect(winnerText({ score_a: 0, score_b: 1 }, pts, { name: 'แดง' }, { name: 'ฟ้า' })).toMatch(/ทีมฟ้า ชนะ/);
    expect(winnerText({ score_a: 1, score_b: 1 }, pts, { name: 'แดง' }, { name: 'ฟ้า' })).toMatch(/เสมอ/);
  });
});

describe('score queue merge rules', () => {
  it('applyOptimistic never goes below zero', () => {
    expect(applyOptimistic({ score_a: 0, score_b: 2 }, 'a', -1)).toEqual({ score_a: 0, score_b: 2 });
    expect(applyOptimistic({ score_a: 0, score_b: 2 }, 'b', 3)).toEqual({ score_a: 0, score_b: 5 });
    expect(applyOptimistic(null, 'a', 1)).toBeNull();
  });

  it('mergeServerRow keeps optimistic scores while taps are still queued', () => {
    const prev = { score_a: 5, score_b: 1, status: 'live', current_set: 1 };
    const server = { score_a: 3, score_b: 1, status: 'live', current_set: 2 };
    expect(mergeServerRow(prev, server, 2)).toEqual({ score_a: 5, score_b: 1, status: 'live', current_set: 2 });
    expect(mergeServerRow(prev, server, 0)).toBe(server);
    expect(mergeServerRow(prev, null, 0)).toBe(prev);
  });

  it('hasScoreChange ignores irrelevant fields', () => {
    const a = { score_a: 1, score_b: 0, sets_a: 0, sets_b: 0, status: 'live', current_set: 1, updated_at: 'x' };
    expect(hasScoreChange(a, { ...a, updated_at: 'y' })).toBe(false);
    expect(hasScoreChange(a, { ...a, score_b: 1 })).toBe(true);
    expect(hasScoreChange(a, { ...a, status: 'finished' })).toBe(true);
  });
});
