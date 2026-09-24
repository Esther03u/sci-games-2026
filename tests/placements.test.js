import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLACEMENT_POINTS,
  computeEventPlacements,
  computeStandings,
  matchWinner,
  normalizePlacementPoints,
  pointsForPlace,
} from '@/lib/placements';

const sports = [
  { id: 'futsal', name: 'ฟุตซอล', scoring_type: 'points', sort_order: 1 },
  { id: 'volley', name: 'วอลเลย์บอล', scoring_type: 'sets', sort_order: 2 },
  { id: 'petanque', name: 'เปตอง', scoring_type: 'points', sort_order: 5 },
];
const teams = [
  { id: 'red', name: 'สีแดง', sort_order: 1 },
  { id: 'blue', name: 'สีฟ้า', sort_order: 2 },
  { id: 'green', name: 'สีเขียว', sort_order: 3 },
  { id: 'purple', name: 'สีม่วง', sort_order: 4 },
];
const m = (sport_id, category, round, a, b, extra = {}) => ({
  sport_id,
  category,
  round,
  team_a_id: a,
  team_b_id: b,
  status: 'finished',
  ...extra,
});
// one full event: red beats blue in the final, green beats purple for 3rd
const fullEvent = (sport_id, category, [w1, l1, w3, l3], scores = { score_a: 3, score_b: 1 }) => [
  m(sport_id, category, 'ชิงชนะเลิศ', w1, l1, scores),
  m(sport_id, category, 'ชิงอันดับ 3', w3, l3, scores),
  m(sport_id, category, 'รอบแรก', w1, w3, scores), // ignored
];

describe('matchWinner', () => {
  it('uses the score for points sports and sets for set sports', () => {
    expect(matchWinner({ status: 'finished', score_a: 2, score_b: 5 }, 'points')).toBe('b');
    expect(matchWinner({ status: 'finished', score_a: 10, score_b: 25, sets_a: 2, sets_b: 1 }, 'sets')).toBe(
      'a'
    );
  });
  it('is null while unfinished or level', () => {
    expect(matchWinner({ status: 'live', score_a: 3, score_b: 0 }, 'points')).toBeNull();
    expect(matchWinner({ status: 'finished', score_a: 1, score_b: 1 }, 'points')).toBeNull();
    expect(matchWinner(null, 'points')).toBeNull();
  });
});

describe('computeEventPlacements', () => {
  it('gives 1st–4th from the final and the third-place match', () => {
    const [e] = computeEventPlacements(
      fullEvent('futsal', 'ชาย', ['red', 'blue', 'green', 'purple']),
      sports
    );
    expect(e).toMatchObject({ sport_name: 'ฟุตซอล', category: 'ชาย', done: true });
    expect(e.places).toEqual([
      { place: 1, team_id: 'red' },
      { place: 2, team_id: 'blue' },
      { place: 3, team_id: 'green' },
      { place: 4, team_id: 'purple' },
    ]);
  });

  it('a set sport is decided by sets, not the last set score', () => {
    const [e] = computeEventPlacements(
      fullEvent('volley', 'หญิง', ['purple', 'green', 'red', 'blue'], {
        score_a: 8,
        score_b: 15,
        sets_a: 2,
        sets_b: 1,
      }),
      sports
    );
    expect(e.places[0]).toEqual({ place: 1, team_id: 'purple' });
  });

  it('partial: only the third-place match finished → 3rd/4th known, not done', () => {
    const matches = [
      m('futsal', 'หญิง', 'ชิงชนะเลิศ', null, null, { status: 'upcoming' }),
      m('futsal', 'หญิง', 'ชิงอันดับ 3', 'blue', 'red', { score_a: 2, score_b: 0 }),
    ];
    const [e] = computeEventPlacements(matches, sports);
    expect(e.done).toBe(false);
    expect(e.places).toEqual([
      { place: 3, team_id: 'blue' },
      { place: 4, team_id: 'red' },
    ]);
  });

  it('orders events by sport then category (ชาย, หญิง, คู่ชาย, คู่หญิง, คู่ผสม)', () => {
    const matches = [
      ...fullEvent('petanque', 'คู่ผสม', ['red', 'blue', 'green', 'purple']),
      ...fullEvent('petanque', 'คู่ชาย', ['red', 'blue', 'green', 'purple']),
      ...fullEvent('futsal', 'หญิง', ['red', 'blue', 'green', 'purple']),
      ...fullEvent('futsal', 'ชาย', ['red', 'blue', 'green', 'purple']),
    ];
    expect(computeEventPlacements(matches, sports).map((e) => `${e.sport_name} ${e.category}`)).toEqual([
      'ฟุตซอล ชาย',
      'ฟุตซอล หญิง',
      'เปตอง คู่ชาย',
      'เปตอง คู่ผสม',
    ]);
  });

  it('accepts the English bracket round keys too', () => {
    const matches = [m('futsal', 'ชาย', 'final', 'red', 'blue', { score_a: 1, score_b: 0 })];
    expect(computeEventPlacements(matches, sports)[0].places).toHaveLength(2);
  });
});

describe('computeStandings', () => {
  it('adds points per place; every event counts in full (petanque 3 events)', () => {
    const events = computeEventPlacements(
      [
        ...fullEvent('futsal', 'ชาย', ['red', 'blue', 'green', 'purple']),
        ...fullEvent('petanque', 'คู่ชาย', ['blue', 'red', 'green', 'purple']),
        ...fullEvent('petanque', 'คู่หญิง', ['blue', 'red', 'green', 'purple']),
      ],
      sports
    );
    const table = computeStandings(events, teams, [10, 7, 5, 3]);
    expect(table.map((r) => [r.name, r.total_points, r.rank])).toEqual([
      ['สีฟ้า', 7 + 10 + 10, 1],
      ['สีแดง', 10 + 7 + 7, 2],
      ['สีเขียว', 15, 3],
      ['สีม่วง', 9, 4],
    ]);
    expect(table[0]).toMatchObject({ golds: 2, silvers: 1, bronzes: 0, fourths: 0 });
  });

  it('ties: more golds wins, then silvers, then bronzes; a full tie shares the rank', () => {
    // red: 1st + 4th, blue: 2nd + 3rd → both 5 with 4-3-2-1; red has a gold
    const events = computeEventPlacements(
      [
        ...fullEvent('futsal', 'ชาย', ['red', 'blue', 'green', 'purple']),
        ...fullEvent('futsal', 'หญิง', ['green', 'purple', 'blue', 'red']),
      ],
      sports
    );
    const table = computeStandings(events, teams, [4, 3, 2, 1]);
    const byName = Object.fromEntries(table.map((r) => [r.name, r]));
    expect(byName['สีแดง'].total_points).toBe(5);
    expect(byName['สีฟ้า'].total_points).toBe(5);
    expect(byName['สีเขียว'].total_points).toBe(6);
    expect(table.map((r) => r.name)).toEqual(['สีเขียว', 'สีแดง', 'สีฟ้า', 'สีม่วง']);
    // purple: 2nd + 4th = 4 → rank 4; nobody fully tied here
    expect(table.map((r) => r.rank)).toEqual([1, 2, 3, 4]);

    const mirror = computeEventPlacements(
      [
        ...fullEvent('futsal', 'ชาย', ['red', 'blue', 'green', 'purple']),
        ...fullEvent('futsal', 'หญิง', ['blue', 'red', 'purple', 'green']),
      ],
      sports
    );
    const shared = computeStandings(mirror, teams, [4, 3, 2, 1]);
    expect(shared.slice(0, 2).map((r) => r.rank)).toEqual([1, 1]);
    expect(shared.slice(2).map((r) => r.rank)).toEqual([3, 3]);
  });

  it('no finished events → everyone 0, ranked together', () => {
    const table = computeStandings([], teams);
    expect(table.every((r) => r.total_points === 0 && r.rank === 1)).toBe(true);
  });

  it('decimal points do not produce float noise', () => {
    const events = computeEventPlacements(
      fullEvent('futsal', 'ชาย', ['red', 'blue', 'green', 'purple']),
      sports
    );
    const table = computeStandings([...events, ...events, ...events], teams, [0.1, 0, 0, 0]);
    expect(table[0].total_points).toBe(0.3);
  });
});

describe('placement points setting', () => {
  it('accepts 4 non-negative numbers, otherwise the default', () => {
    expect(normalizePlacementPoints([10, 7, 5, 3])).toEqual([10, 7, 5, 3]);
    expect(normalizePlacementPoints([4, 3, 2])).toEqual(DEFAULT_PLACEMENT_POINTS);
    expect(normalizePlacementPoints([4, 3, -1, 0])).toEqual(DEFAULT_PLACEMENT_POINTS);
    expect(normalizePlacementPoints('x')).toEqual(DEFAULT_PLACEMENT_POINTS);
    expect(pointsForPlace(2, [10, 7, 5, 3])).toBe(7);
  });
});
