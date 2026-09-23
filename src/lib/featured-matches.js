// "การแข่งขันที่น่าสนใจ" on the home page: one match per sport — the one
// being played, else the next one still to play, else the latest result —
// with live matches first. Decided by status, not the clock, so the ISR copy
// of the page stays right between revalidations.

/** @typedef {import('@/lib/types').Match} Match */

const bySchedule = (a, b) =>
  `${a.match_date} ${a.match_time}`.localeCompare(`${b.match_date} ${b.match_time}`) ||
  (a.match_number ?? 0) - (b.match_number ?? 0);

const RANK = { live: 0, upcoming: 1, postponed: 1, finished: 2 };

/**
 * @param {Match[]} matches  any order
 * @param {Array<{id: string}>} sports  in display order (sort_order)
 * @returns {Match[]} at most one per sport
 */
export function pickFeaturedMatches(matches, sports) {
  const picked = [];
  for (const sport of sports) {
    const own = matches.filter((m) => m.sport_id === sport.id).sort(bySchedule);
    const live = own.find((m) => m.status === 'live');
    const next = own.find((m) => m.status === 'upcoming');
    const last = own.filter((m) => m.status === 'finished').at(-1);
    const pick = live || next || last;
    if (pick) picked.push(pick);
  }
  // live → upcoming → finished; within a group keep the sports order
  return picked
    .map((m, i) => ({ m, i }))
    .sort((a, b) => RANK[a.m.status] - RANK[b.m.status] || a.i - b.i)
    .map(({ m }) => m);
}
