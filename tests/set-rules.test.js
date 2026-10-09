import { describe, expect, it } from 'vitest';
import { projectedSets, setControls, undecidedSetMatch } from '@/lib/set-rules';

const volley = { scoring_type: 'sets', sets_to_win: 2 };
const futsal = { scoring_type: 'points' };

describe('undecidedSetMatch', () => {
  it('blocks finishing a best-of-3 after one set (the 9 ต.ค. case)', () => {
    // set 1 still open 15-10 → would close as 1-0
    expect(undecidedSetMatch({ sets_a: 0, sets_b: 0, score_a: 15, score_b: 10 }, volley)).toMatch(
      /ยังไม่ครบเซต \(ตอนนี้ 1-0/
    );
    // set 1 closed, set 2 at 0-0
    expect(undecidedSetMatch({ sets_a: 1, sets_b: 0, score_a: 0, score_b: 0 }, volley)).toMatch(/1-0/);
    // 1-1 going into set 3
    expect(undecidedSetMatch({ sets_a: 1, sets_b: 1, score_a: 3, score_b: 3 }, volley)).toMatch(/1-1/);
  });

  it('allows finishing once a side has (or will have, closing the open set) the needed sets', () => {
    expect(undecidedSetMatch({ sets_a: 1, sets_b: 0, score_a: 25, score_b: 20 }, volley)).toBe(null);
    expect(undecidedSetMatch({ sets_a: 2, sets_b: 0, score_a: 25, score_b: 20 }, volley)).toBe(null);
    expect(undecidedSetMatch({ sets_a: 1, sets_b: 1, score_a: 9, score_b: 15 }, volley)).toBe(null);
  });

  it('defaults to 2 sets and never blocks points sports', () => {
    expect(
      undecidedSetMatch({ sets_a: 1, sets_b: 0, score_a: 0, score_b: 0 }, { scoring_type: 'sets' })
    ).not.toBe(null);
    expect(undecidedSetMatch({ score_a: 0, score_b: 0 }, futsal)).toBe(null);
    expect(undecidedSetMatch({}, null)).toBe(null);
  });

  it('projectedSets is the shared implementation', () => {
    expect(projectedSets({ sets_a: 1, sets_b: 0, score_a: 0, score_b: 2 })).toEqual({ a: 1, b: 1 });
  });
});

describe('setControls (one end-of-set / end-of-match control at a time)', () => {
  const at = (sets_a, sets_b, score_a, score_b) => ({ sets_a, sets_b, score_a, score_b });
  const show = (c) => `${c.finishSet ? 'set' : ''}${c.finishMatch ? 'match' : ''}` || 'none';

  it('set 1: only "จบเซต"', () => {
    expect(show(setControls(at(0, 0, 15, 10), volley))).toBe('set');
  });

  it('set 2 at 1-0: "จบเซต" when the trailing side leads, the slider when the leader would clinch', () => {
    expect(show(setControls(at(1, 0, 8, 15), volley))).toBe('set');
    expect(show(setControls(at(1, 0, 15, 8), volley))).toBe('match');
  });

  it('deciding set (1-1): never "จบเซต"; slider once someone leads, nothing while tied', () => {
    const tied = setControls(at(1, 1, 7, 7), volley);
    expect(show(tied)).toBe('none');
    expect(tied.hint).toMatch(/เซตตัดสิน \(1-1\)/);
    expect(show(setControls(at(1, 1, 15, 12), volley))).toBe('match');
    expect(show(setControls(at(1, 1, 0, 0), volley))).toBe('none');
  });

  it('points sports: just the finish slider', () => {
    expect(setControls(at(0, 0, 2, 2), futsal)).toEqual({ finishSet: false, finishMatch: true, hint: null });
  });
});
