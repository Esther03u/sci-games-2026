import { describe, expect, it } from 'vitest';
import {
  applyResetToList,
  buildEditSets,
  countSetWins,
  formatSetScores,
  toInputValue,
} from '@/lib/match-editor';

const VOLLEY = { id: 'vb', scoring_type: 'sets', sets_to_win: 2 };
const FUTSAL = { id: 'fs', scoring_type: 'points' };

describe('toInputValue', () => {
  it('turns null/undefined into an empty input and numbers into strings', () => {
    expect(toInputValue(null)).toBe('');
    expect(toInputValue(undefined)).toBe('');
    expect(toInputValue(0)).toBe('0');
    expect(toInputValue(25)).toBe('25');
  });
});

describe('buildEditSets', () => {
  it('returns no rows for points sports', () => {
    expect(buildEditSets({ match_sets: [{ set_number: 1, score_a: 1, score_b: 0 }] }, FUTSAL)).toEqual([]);
    expect(buildEditSets({}, undefined)).toEqual([]);
  });

  it('gives best-of-3 slots filled from saved sets in set order', () => {
    const rows = buildEditSets(
      {
        match_sets: [
          { set_number: 2, score_a: 18, score_b: 25 },
          { set_number: 1, score_a: 25, score_b: 20 },
        ],
      },
      VOLLEY
    );
    expect(rows).toEqual([
      { set_number: 1, score_a: '25', score_b: '20' },
      { set_number: 2, score_a: '18', score_b: '25' },
      { set_number: 3, score_a: '', score_b: '' },
    ]);
  });

  it('gives best-of-5 slots when three sets are needed, and keeps extra saved sets', () => {
    expect(buildEditSets({ match_sets: [] }, { ...VOLLEY, sets_to_win: 3 })).toHaveLength(5);
    const many = Array.from({ length: 4 }, (_, i) => ({ set_number: i + 1, score_a: 1, score_b: 0 }));
    expect(buildEditSets({ match_sets: many }, VOLLEY)).toHaveLength(4);
  });

  it('does not reorder the match row it was given', () => {
    const sets = [
      { set_number: 2, score_a: 1, score_b: 0 },
      { set_number: 1, score_a: 0, score_b: 1 },
    ];
    buildEditSets({ match_sets: sets }, VOLLEY);
    expect(sets.map((s) => s.set_number)).toEqual([2, 1]);
  });
});

describe('countSetWins', () => {
  it('counts only sets with both scores, ignoring ties', () => {
    const r = countSetWins([
      { score_a: '25', score_b: '20' },
      { score_a: '18', score_b: '25' },
      { score_a: '15', score_b: '15' },
      { score_a: '15', score_b: '' },
    ]);
    expect(r.setsA).toBe(1);
    expect(r.setsB).toBe(1);
    expect(r.filled).toHaveLength(3);
  });

  it('handles no sets', () => {
    expect(countSetWins([])).toEqual({ filled: [], setsA: 0, setsB: 0 });
  });
});

describe('applyResetToList', () => {
  const semi = {
    id: 'semi',
    status: 'finished',
    score_a: 2,
    score_b: 0,
    is_walkover: true,
    match_sets: [{ set_number: 1 }],
    next_match_id: 'final',
    next_match_slot: 'b',
    loser_next_match_id: 'third',
    loser_next_match_slot: 'a',
  };
  const final = { id: 'final', team_a_id: 'x', team_b_id: 'winner' };
  const third = { id: 'third', team_a_id: 'loser', team_b_id: 'y' };
  const other = { id: 'other', team_a_id: 'p', team_b_id: 'q' };

  it('clears the score and the bracket slots the match fed', () => {
    const out = applyResetToList([semi, final, third, other], semi, { started_at: null });
    expect(out[0]).toMatchObject({
      status: 'upcoming',
      score_a: null,
      score_b: null,
      is_walkover: false,
      match_sets: [],
      started_at: null,
    });
    expect(out[1]).toEqual({ id: 'final', team_a_id: 'x', team_b_id: null });
    expect(out[2]).toEqual({ id: 'third', team_a_id: null, team_b_id: 'y' });
    expect(out[3]).toBe(other);
  });

  it('leaves other matches alone when the match feeds nothing', () => {
    const lone = { id: 'lone', status: 'finished', next_match_id: null, loser_next_match_id: null };
    const out = applyResetToList([lone, other], lone, {});
    expect(out[1]).toBe(other);
  });
});

describe('formatSetScores', () => {
  it('lists finished sets in order', () => {
    expect(
      formatSetScores([
        { set_number: 2, score_a: 18, score_b: 25 },
        { set_number: 1, score_a: 25, score_b: 20 },
        { set_number: 3, score_a: null, score_b: null },
      ])
    ).toBe('25-20 | 18-25');
  });
});
