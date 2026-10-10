// Podium reveal (plan docs/plans/2026-10-10-podium-reveal.md): the step-by-step
// timeline the bars animate through, each colour's score breakdown, and the
// bar heights. Pure — unit-tested in tests/podium-reveal.test.js. Input is
// what /api/standings returns after the reveal (events + standings + points).
import {
  convertRawTo100Scale,
  MAX_RAW_POINTS,
  normalizePlacementPoints,
  TOTAL_EVENTS_COUNT,
  usesHandbookScale,
} from '@/lib/placements';

export const PLACE_ICON = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '' };
/** Short place for the "+points" pop. */
export const PLACE_SHORT = { 1: '🥇 ที่ 1', 2: '🥈 ที่ 2', 3: '🥉 ที่ 3', 4: 'ที่ 4' };
export const PLACE_LABEL = { 1: 'ชนะเลิศ', 2: 'รองชนะเลิศอันดับ 1', 3: 'รองชนะเลิศอันดับ 2', 4: 'อันดับ 4' };

/** "ฟุตซอล ชาย" — an event's display name. */
export const eventLabel = (e) => [e.sport_name, e.category].filter(Boolean).join(' ');

/**
 * One step per event that has at least one placement, in event order (sport,
 * then category — the handbook order computeEventPlacements returns).
 * @returns {{ steps: Array<{ key: string, label: string, index: number,
 *   gains: Array<{ team_id: string, place: number, points: number }>,
 *   totals: Record<string, number> }>, final: Record<string, number>,
 *   eventsDone: number, eventsTotal: number }}
 */
export function buildRevealTimeline(events = [], teams = [], points) {
  const pts = normalizePlacementPoints(points);
  const totals = Object.fromEntries(teams.map((t) => [t.id, 0]));
  const steps = [];
  for (const e of events) {
    const gains = (e.places || [])
      .filter((p) => p.team_id in totals)
      .map((p) => ({ team_id: p.team_id, place: p.place, points: pts[p.place - 1] }))
      .sort((a, b) => a.place - b.place);
    if (!gains.length) continue;
    for (const g of gains) totals[g.team_id] = Math.round((totals[g.team_id] + g.points) * 100) / 100;
    steps.push({ key: e.key, label: eventLabel(e), index: steps.length + 1, gains, totals: { ...totals } });
  }
  return {
    steps,
    final: { ...totals },
    eventsDone: events.filter((e) => e.done).length,
    eventsTotal: Math.max(TOTAL_EVENTS_COUNT, events.length),
  };
}

/**
 * Where one colour's score comes from: every event it placed in, the raw sum
 * and how the shown total is worked out.
 */
export function teamBreakdown(teamId, events = [], points) {
  const pts = normalizePlacementPoints(points);
  const rows = [];
  const medals = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const e of events) {
    const p = (e.places || []).find((x) => x.team_id === teamId);
    if (!p) continue;
    medals[p.place] += 1;
    rows.push({ key: e.key, label: eventLabel(e), place: p.place, points: pts[p.place - 1] });
  }
  const raw = Math.round(rows.reduce((s, r) => s + r.points, 0) * 100) / 100;
  const scaled = usesHandbookScale(pts);
  return {
    rows,
    medals,
    raw,
    maxRaw: MAX_RAW_POINTS,
    scaled,
    total: scaled ? convertRawTo100Scale(raw) : raw,
    formula: scaled ? `${raw} × 100 ÷ ${MAX_RAW_POINTS}` : null,
  };
}

/** Bar height in % of the stage: every bar starts at `base`, the rest grows with the raw score. */
export function barHeight(raw, { base = 35, maxRaw = MAX_RAW_POINTS } = {}) {
  const share = maxRaw > 0 ? Math.min(Math.max(raw / maxRaw, 0), 1) : 0;
  return Math.round((base + share * (100 - base)) * 10) / 10;
}

/** Shown number for a raw score: out of 100 with the handbook points, else raw. */
export const displayScore = (raw, points) =>
  usesHandbookScale(normalizePlacementPoints(points)) ? convertRawTo100Scale(raw) : raw;

// ---------------------------------------------------------------- simulation

/** The 11 events of the handbook, for the admin "จำลองการเฉลย" preview. */
export const MOCK_EVENT_NAMES = [
  ['ฟุตซอล', 'ชาย'],
  ['ฟุตซอล', 'หญิง'],
  ['วอลเลย์บอล', 'ชาย'],
  ['วอลเลย์บอล', 'หญิง'],
  ['เซปักตะกร้อ', 'ชาย'],
  ['เซปักตะกร้อ', 'หญิง'],
  ['บาสเกตบอล', 'ชาย'],
  ['บาสเกตบอล', 'หญิง'],
  ['เปตอง', 'คู่ชาย'],
  ['เปตอง', 'คู่หญิง'],
  ['เปตอง', 'คู่ผสม'],
];

/** Small seeded PRNG so a simulation can be replayed exactly. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Made-up results for the simulation: random 1st–4th per event among `teams`
 * (needs 4). Never real data — the caller labels it "ข้อมูลจำลอง".
 */
export function mockEvents(teams, seed = Date.now()) {
  const rand = mulberry32(seed);
  const ids = teams.slice(0, 4).map((t) => t.id);
  return MOCK_EVENT_NAMES.map(([sport_name, category], i) => {
    const order = [...ids];
    for (let j = order.length - 1; j > 0; j--) {
      const k = Math.floor(rand() * (j + 1));
      [order[j], order[k]] = [order[k], order[j]];
    }
    return {
      key: `mock-${i}`,
      sport_id: `mock-sport-${i}`,
      sport_name,
      category,
      places: order.map((team_id, p) => ({ place: p + 1, team_id })),
      done: true,
    };
  });
}

// ---------------------------------------------------------------- teaser

/**
 * A partial score for the teaser before the reveal (admin switch
 * podium_teaser): the first and last digit are replaced by "X", e.g. 72.36 →
 * "X2.3X". Built on the server so the hidden digits never reach the browser.
 */
export function maskScore(total, scaled = true) {
  const s = scaled
    ? Number(total || 0)
        .toFixed(2)
        .padStart(5, '0')
    : String(Math.round(Number(total || 0)));
  const digits = [...s].map((c, i) => (/\d/.test(c) ? i : -1)).filter((i) => i >= 0);
  if (digits.length < 2) return 'X';
  const hide = new Set([digits[0], digits.at(-1)]);
  return [...s].map((c, i) => (hide.has(i) ? 'X' : c)).join('');
}

/** One teaser per colour from the standings rows (computeStandings). */
export const buildTeaser = (standings, points) => {
  const scaled = usesHandbookScale(normalizePlacementPoints(points));
  return standings.map((r) => ({ team_id: r.id, masked: maskScore(r.total_points, scaled) }));
};
