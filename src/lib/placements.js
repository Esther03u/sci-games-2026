// Overall standings by placement (plan docs/plans/2026-09-25-departments-and-placement-points.md).
//
// Every event (sport × category, e.g. ฟุตซอล ชาย, เปตอง คู่ผสม) is a 4-team
// knockout. Its final gives 1st/2nd, its third-place match 3rd/4th. Each
// place earns the points the admin set (app_settings.placement_points), and
// every event counts in full — no weighting per sport (decision 25 ก.ย.).
// Ties: more 1st places, then 2nd, then 3rd; still equal → shared rank.
//
// Pure functions over public match rows (matches_public_v3), so the same code
// serves the results page, the admin dashboard and the reveal API.

/** @typedef {import('@/lib/types').Match} Match */

export const DEFAULT_PLACEMENT_POINTS = [4, 3, 2, 1];

const FINAL_ROUNDS = new Set(['ชิงชนะเลิศ', 'final']);
const THIRD_ROUNDS = new Set(['ชิงอันดับ 3', 'third']);
const CATEGORY_ORDER = ['ชาย', 'หญิง', 'คู่ชาย', 'คู่หญิง', 'ผสม', 'คู่ผสม'];

/** 4 non-negative numbers, 1st→4th; anything else falls back to the default. */
export function normalizePlacementPoints(value) {
  if (Array.isArray(value) && value.length === 4 && value.every((n) => Number.isFinite(n) && n >= 0)) {
    return value.map(Number);
  }
  return DEFAULT_PLACEMENT_POINTS;
}

/** 'a' | 'b' | null — sets decide set sports, the score decides the rest; null if unfinished or level. */
export function matchWinner(match, scoringType) {
  if (!match || match.status !== 'finished') return null;
  const [a, b] = scoringType === 'sets' ? [match.sets_a, match.sets_b] : [match.score_a, match.score_b];
  if (a == null || b == null || a === b) return null;
  return a > b ? 'a' : 'b';
}

const winnerLoser = (match, scoringType) => {
  const w = matchWinner(match, scoringType);
  if (!w) return [null, null];
  return w === 'a' ? [match.team_a_id, match.team_b_id] : [match.team_b_id, match.team_a_id];
};

/**
 * One entry per event that has a final, in sport order then category order.
 * @param {Match[]} matches
 * @param {Array<{id: string, name: string, scoring_type?: string, sort_order?: number}>} sports
 * @returns {Array<{key: string, sport_id: string, sport_name: string, category: string,
 *   places: Array<{place: 1|2|3|4, team_id: string}>, done: boolean}>}
 */
export function computeEventPlacements(matches, sports) {
  const sportById = new Map(sports.map((s) => [s.id, s]));
  const events = new Map();
  for (const m of matches) {
    const isFinal = FINAL_ROUNDS.has(m.round);
    const isThird = THIRD_ROUNDS.has(m.round);
    if (!isFinal && !isThird) continue;
    const key = `${m.sport_id}|${m.category ?? ''}`;
    if (!events.has(key))
      events.set(key, { sport_id: m.sport_id, category: m.category ?? '', final: null, third: null });
    events.get(key)[isFinal ? 'final' : 'third'] = m;
  }

  const out = [];
  for (const [key, e] of events) {
    if (!e.final) continue;
    const sport = sportById.get(e.sport_id);
    const [first, second] = winnerLoser(e.final, sport?.scoring_type);
    const [third, fourth] = winnerLoser(e.third, sport?.scoring_type);
    const places = [
      [1, first],
      [2, second],
      [3, third],
      [4, fourth],
    ]
      .filter(([, team]) => team)
      .map(([place, team_id]) => ({ place, team_id }));
    out.push({
      key,
      sport_id: e.sport_id,
      sport_name: sport?.name ?? '',
      sort_order: sport?.sort_order ?? 0,
      category: e.category,
      places,
      done: places.length === 4,
    });
  }
  const catRank = (c) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  return out
    .sort((a, b) => a.sort_order - b.sort_order || catRank(a.category) - catRank(b.category))
    .map(({ sort_order, ...e }) => e);
}

/**
 * Overall table: one row per team, best first, with `rank` (shared on a full tie).
 * @param {ReturnType<typeof computeEventPlacements>} events
 * @param {Array<{id: string, name: string, color_hex?: string, logo_emoji?: string, sort_order?: number}>} teams
 * @param {number[]} points  1st→4th
 */
export function computeStandings(events, teams, points = DEFAULT_PLACEMENT_POINTS) {
  const pts = normalizePlacementPoints(points);
  const rows = new Map(
    teams.map((t) => [t.id, { ...t, total_points: 0, golds: 0, silvers: 0, bronzes: 0, fourths: 0 }])
  );
  const field = { 1: 'golds', 2: 'silvers', 3: 'bronzes', 4: 'fourths' };
  for (const e of events) {
    for (const { place, team_id } of e.places) {
      const row = rows.get(team_id);
      if (!row) continue;
      row.total_points += pts[place - 1];
      row[field[place]] += 1;
    }
  }
  // avoid 0.30000000000000004 when points are decimals
  for (const r of rows.values()) r.total_points = Math.round(r.total_points * 100) / 100;

  const cmp = (a, b) =>
    b.total_points - a.total_points || b.golds - a.golds || b.silvers - a.silvers || b.bronzes - a.bronzes;
  const sorted = [...rows.values()].sort((a, b) => cmp(a, b) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  sorted.forEach((r, i) => {
    r.rank = i > 0 && cmp(sorted[i - 1], r) === 0 ? sorted[i - 1].rank : i + 1;
  });
  return sorted;
}

/** Points a place earns, for showing next to each result. */
export const pointsForPlace = (place, points = DEFAULT_PLACEMENT_POINTS) =>
  normalizePlacementPoints(points)[place - 1] ?? 0;
