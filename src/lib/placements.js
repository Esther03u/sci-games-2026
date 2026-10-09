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

export const DEFAULT_PLACEMENT_POINTS = [30, 25, 20, 15];
export const TOTAL_EVENTS_COUNT = 11;
export const MAX_RAW_POINTS = 330;

const FINAL_ROUNDS = new Set(['ชิงชนะเลิศ', 'final']);
const THIRD_ROUNDS = new Set(['ชิงอันดับ 3', 'third']);
const CATEGORY_ORDER = ['ชาย', 'หญิง', 'คู่ชาย', 'คู่หญิง', 'ผสม', 'คู่ผสม'];

/**
 * Converts raw tournament points (out of 330) into the 100-point scale:
 * คะแนนรวม = คะแนนดิบรวม × 100 ÷ 330 (ทศนิยม 2 ตำแหน่ง)
 */
export function convertRawTo100Scale(rawPoints, maxRaw = MAX_RAW_POINTS) {
  if (!rawPoints || maxRaw <= 0) return 0;
  return Math.round(((rawPoints * 100) / maxRaw) * 100) / 100;
}

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
      done: places.length === (e.third ? 4 : 2),
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
export function computeStandings(events, teams, points = DEFAULT_PLACEMENT_POINTS, options = {}) {
  const pts = normalizePlacementPoints(points);
  const rows = new Map(
    teams.map((t) => [
      t.id,
      {
        ...t,
        raw_points: 0,
        scaled_points: 0,
        total_points: 0,
        golds: 0,
        silvers: 0,
        bronzes: 0,
        fourths: 0,
      },
    ])
  );
  const field = { 1: 'golds', 2: 'silvers', 3: 'bronzes', 4: 'fourths' };
  for (const e of events) {
    for (const { place, team_id } of e.places) {
      const row = rows.get(team_id);
      if (!row) continue;
      row.raw_points += pts[place - 1];
      row[field[place]] += 1;
    }
  }

  // เกณฑ์สูจิบัตรทางการ (100 คะแนนเต็ม):
  // คะแนนรวม = คะแนนดิบรวม × 100 ÷ 330 (คิดทศนิยม 2 ตำแหน่ง)
  // หากใช้เกณฑ์สูจิบัตรมาตรฐาน [30, 25, 20, 15] หรือ options.scaleTo100 ให้แปลงคะแนนเป็นเต็ม 100
  // หากตั้งค่าคะแนนดิบกำหนดเองโดยไม่ระบุสเกล ให้ total_points เป็นคะแนนดิบ
  const isHandbookScale =
    options.scaleTo100 ?? (pts[0] === 30 && pts[1] === 25 && pts[2] === 20 && pts[3] === 15);

  for (const r of rows.values()) {
    r.raw_points = Math.round(r.raw_points * 100) / 100;
    r.scaled_points = convertRawTo100Scale(r.raw_points, MAX_RAW_POINTS);
    r.total_points = isHandbookScale ? r.scaled_points : r.raw_points;
  }

  // เกณฑ์การตัดสินกรณีคะแนนรวมเท่ากัน (สูจิบัตร ข้อ 3):
  // 1. คะแนนรวมสูงสุด
  // 2. หากเท่ากัน ให้พิจารณาจำนวนถ้วยรางวัลชนะเลิศมากกว่า (golds)
  // 3. หากยังเท่ากัน ให้พิจารณารองชนะเลิศอันดับ 1 (silvers)
  // 4. หากยังเท่ากัน ให้พิจารณารองชนะเลิศอันดับ 2 (bronzes)
  // 5. หากยังเท่ากัน ให้ครองอันดับร่วมกัน (shared rank)
  const cmp = (a, b) =>
    b.total_points - a.total_points ||
    b.raw_points - a.raw_points ||
    b.golds - a.golds ||
    b.silvers - a.silvers ||
    b.bronzes - a.bronzes;

  const sorted = [...rows.values()].sort((a, b) => cmp(a, b) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  sorted.forEach((r, i) => {
    r.rank = i > 0 && cmp(sorted[i - 1], r) === 0 ? sorted[i - 1].rank : i + 1;
  });
  return sorted;
}

/** Points a place earns, for showing next to each result. */
export const pointsForPlace = (place, points = DEFAULT_PLACEMENT_POINTS) =>
  normalizePlacementPoints(points)[place - 1] ?? 0;
