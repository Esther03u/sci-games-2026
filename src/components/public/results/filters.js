// Pure filter/sort helpers for the /results page (no React) — unit-tested.

/** @typedef {import('@/lib/types').Match} Match */
/** @typedef {import('@/lib/types').Sport} Sport */
/** @typedef {{ sport?: string, status?: string, category?: string }} ResultsFilter */

export const CATEGORIES = [
  { key: 'all', label: 'ทุกประเภท' },
  { key: 'ชาย', label: 'ทีมชาย' },
  { key: 'หญิง', label: 'ทีมหญิง' },
  { key: 'ผสม', label: 'คู่ผสม' },
];

export const STATUS_TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'finished', label: 'จบแล้ว' },
  { key: 'live', label: 'กำลังแข่ง', isLive: true },
  { key: 'upcoming', label: 'รอแข่ง' },
];

// Handbook ids look like 'sport-futsal' while DB ids are uuids; the loose
// `includes` keeps the handbook fallback working with the same selector.
export const isSport = (m, sportId) =>
  sportId === 'all' ||
  m.sport_id === sportId ||
  (!!m.sport_id && m.sport_id.toLowerCase().includes(sportId.toLowerCase()));

export const sportOf = (sports, m) => sports.find((s) => isSport(m, s.id));

const isStatus = (m, status) => {
  if (status === 'all') return true;
  if (status === 'upcoming') return m.status === 'upcoming' || m.status === 'postponed';
  return m.status === status;
};

const isCategory = (m, category) => category === 'all' || (!!m.category && m.category.includes(category));

/** Chronological: date, time, then match_number. Returns a new array. */
export function sortChrono(list) {
  return [...list].sort((a, b) => {
    const d = (a.match_date || '').localeCompare(b.match_date || '');
    if (d !== 0) return d;
    const t = (a.match_time || '').localeCompare(b.match_time || '');
    if (t !== 0) return t;
    return (a.match_number || 0) - (b.match_number || 0);
  });
}

/**
 * All matches passing the three filters, chronologically.
 * @param {Match[]} matches
 * @param {ResultsFilter} filters
 * @returns {Match[]}
 */
export function filterMatches(matches, { sport = 'all', status = 'all', category = 'all' }) {
  return sortChrono(
    matches.filter((m) => isSport(m, sport) && isStatus(m, status) && isCategory(m, category))
  );
}

/** Split an already-filtered list into the three sections shown on the page. */
export function groupByStatus(filtered) {
  return {
    live: filtered.filter((m) => m.status === 'live'),
    finished: filtered.filter((m) => m.status === 'finished'),
    upcoming: filtered.filter((m) => isStatus(m, 'upcoming')),
  };
}

/**
 * The single next match per sport (or just the next one when a sport is
 * selected), ordered by time then sports.sort_order.
 */
export function nextUpcoming(upcoming, { sport = 'all', sports = [] }) {
  if (sport !== 'all') return upcoming.filter((m) => isSport(m, sport)).slice(0, 1);
  const seen = new Set();
  const firsts = [];
  for (const m of upcoming) {
    if (seen.has(m.sport_id)) continue;
    seen.add(m.sport_id);
    firsts.push(m);
  }
  const order = (m) => sportOf(sports, m)?.sort_order || 0;
  return firsts.sort((a, b) => {
    const d = (a.match_date || '').localeCompare(b.match_date || '');
    if (d !== 0) return d;
    const t = (a.match_time || '').localeCompare(b.match_time || '');
    if (t !== 0) return t;
    if (order(a) !== order(b)) return order(a) - order(b);
    return (a.match_number || 0) - (b.match_number || 0);
  });
}

/** Tab-bar counts: filtered by sport + category only, so they stay stable across status tabs. */
export function statusCounts(matches, { sport = 'all', category = 'all' }) {
  const list = matches.filter((m) => isSport(m, sport) && isCategory(m, category));
  return {
    all: list.length,
    finished: list.filter((m) => m.status === 'finished').length,
    live: list.filter((m) => m.status === 'live').length,
    upcoming: list.filter((m) => isStatus(m, 'upcoming')).length,
  };
}
