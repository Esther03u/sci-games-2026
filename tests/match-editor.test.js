import { describe, expect, it } from 'vitest';
import {
  applyResetToList,
  buildEditSets,
  countSetWins,
  formatSetScores,
  mergeEditedSets,
  setScoreOverride,
  statusSteps,
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

describe('setScoreOverride', () => {
  it('sends sets won plus the last filled set as the visible score', () => {
    const r = setScoreOverride(
      [
        { set_number: 1, score_a: '25', score_b: '20' },
        { set_number: 2, score_a: '18', score_b: '25' },
        { set_number: 3, score_a: '15', score_b: '10' },
      ],
      { score_a: null, score_b: null }
    );
    expect(r).toMatchObject({ setsA: 2, setsB: 1, scoreA: 15, scoreB: 10 });
    expect(r.filled).toHaveLength(3);
  });

  it('uses the highest set number even if rows are out of order, skipping empty sets', () => {
    const r = setScoreOverride(
      [
        { set_number: 2, score_a: '18', score_b: '25' },
        { set_number: 1, score_a: '25', score_b: '20' },
        { set_number: 3, score_a: '', score_b: '' },
      ],
      {}
    );
    expect(r).toMatchObject({ setsA: 1, setsB: 1, scoreA: 18, scoreB: 25 });
  });

  it('keeps the current points when no set is filled in', () => {
    expect(
      setScoreOverride([{ set_number: 1, score_a: '', score_b: '' }], { score_a: 7, score_b: 4 })
    ).toMatchObject({
      setsA: 0,
      setsB: 0,
      scoreA: 7,
      scoreB: 4,
    });
  });
});

describe('mergeEditedSets', () => {
  it('overwrites edited sets by number, keeps the rest, returns numbers in set order', () => {
    const existing = [
      { id: 's1', set_number: 1, score_a: 10, score_b: 25 },
      { id: 's3', set_number: 3, score_a: 15, score_b: 13 },
    ];
    const out = mergeEditedSets(existing, [
      { set_number: 2, score_a: '25', score_b: '18' },
      { set_number: 1, score_a: '25', score_b: '20' },
    ]);
    expect(out).toEqual([
      { id: 's1', set_number: 1, score_a: 25, score_b: 20, status: 'finished' },
      { set_number: 2, score_a: 25, score_b: 18, status: 'finished' },
      { id: 's3', set_number: 3, score_a: 15, score_b: 13 },
    ]);
  });

  it('works when the match row has no sets loaded', () => {
    expect(mergeEditedSets(undefined, [{ set_number: 1, score_a: '1', score_b: '0' }])).toEqual([
      { set_number: 1, score_a: 1, score_b: 0, status: 'finished' },
    ]);
  });

  it('feeds back into buildEditSets so a second edit starts from the saved scores', () => {
    const saved = mergeEditedSets(
      [],
      [
        { set_number: 1, score_a: '25', score_b: '20' },
        { set_number: 2, score_a: '18', score_b: '25' },
      ]
    );
    expect(countSetWins(buildEditSets({ match_sets: saved }, VOLLEY))).toMatchObject({ setsA: 1, setsB: 1 });
  });
});

describe('statusSteps', () => {
  it('starts a match before finishing it (finish_match only accepts live matches)', () => {
    expect(statusSteps('upcoming', 'finished')).toEqual({ before: 'start', after: 'finish' });
    expect(statusSteps('postponed', 'finished')).toEqual({ before: 'start', after: 'finish' });
  });

  it('starts upcoming matches and reopens finished ones when set to live', () => {
    expect(statusSteps('upcoming', 'live')).toEqual({ before: 'start', after: null });
    expect(statusSteps('finished', 'live')).toEqual({ before: 'reopen', after: null });
    expect(statusSteps('live', 'live')).toEqual({ before: null, after: null });
  });

  it('finishes live matches and leaves finished ones alone', () => {
    expect(statusSteps('live', 'finished')).toEqual({ before: null, after: 'finish' });
    expect(statusSteps('finished', 'finished')).toEqual({ before: null, after: null });
  });

  it('patches the status for upcoming / postponed', () => {
    expect(statusSteps('upcoming', 'postponed')).toEqual({ before: null, after: 'patch' });
    expect(statusSteps('live', 'postponed')).toEqual({ before: null, after: 'patch' });
    expect(statusSteps('postponed', 'postponed')).toEqual({ before: null, after: null });
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
