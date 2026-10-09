// "การแข่งขันที่น่าสนใจ" on the home page: every match being played, then
// what is still to play today (Thai date). When nothing is live and today's
// programme is done, the next match day's programme; with nothing left to
// play at all, the latest result of each sport.

/** @typedef {import('@/lib/types').Match} Match */

const byTime = (a, b) => `${a.match_date} ${a.match_time}`.localeCompare(`${b.match_date} ${b.match_time}`);

/** Calendar day in Thai time (UTC+7, no DST) → 'YYYY-MM-DD'. */
export function thaiToday(now = Date.now()) {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * @param {Match[]} matches  any order
 * @param {Array<{id: string}>} sports  in display order (sort_order)
 * @param {string} today  'YYYY-MM-DD' in Thai time
 * @returns {Match[]}
 */
export function pickFeaturedMatches(matches, sports, today) {
  const order = new Map(sports.map((s, i) => [s.id, i]));
  const known = matches.filter((m) => order.has(m.sport_id));
  // time, then sport order (match numbers restart per sport), then match_number
  const sorted = [...known].sort(
    (a, b) =>
      byTime(a, b) ||
      order.get(a.sport_id) - order.get(b.sport_id) ||
      (a.match_number ?? 0) - (b.match_number ?? 0)
  );

  const live = sorted.filter((m) => m.status === 'live');
  const upcoming = sorted.filter((m) => m.status === 'upcoming');
  const todays = upcoming.filter((m) => m.match_date === today);
  if (live.length || todays.length) return [...live, ...todays];

  const nextDay = upcoming.find((m) => (m.match_date || '') > today)?.match_date;
  if (nextDay) return upcoming.filter((m) => m.match_date === nextDay);

  // nothing left to play: the latest result of each sport, in sports order
  return sports
    .map((s) => sorted.filter((m) => m.sport_id === s.id && m.status === 'finished').at(-1))
    .filter(Boolean);
}
