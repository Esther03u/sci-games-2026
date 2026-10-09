// Filtering and grouping for the public /schedule grid (components/public/ScheduleGrid).
// Pure, unit-tested in tests/schedule-grid.test.js.
import { EVENT_START_DATE } from '@/lib/format';

/** Sport of a match — exact id, or (legacy seed ids) an id the match's sport_id contains. */
export function sportMatches(m, sportId) {
  return (
    m.sport_id === sportId || Boolean(m.sport_id && m.sport_id.toLowerCase().includes(sportId.toLowerCase()))
  );
}

export const findSportFor = (m, sports) => sports.find((s) => sportMatches(m, s.id));

export function filterSchedule(matches, { day = 'all', sport = 'all', category = 'all' } = {}) {
  return matches.filter((m) => {
    const matchDay = day === 'all' || m.match_date === day;
    const matchSport = sport === 'all' || sportMatches(m, sport);
    const matchCat = category === 'all' || Boolean(m.category && m.category.includes(category));
    return matchDay && matchSport && matchCat;
  });
}

const byDateTime = (a, b) =>
  (a.match_date || '').localeCompare(b.match_date || '') ||
  (a.match_time || '').localeCompare(b.match_time || '');

export const timeSlotLabel = (m) =>
  m.time_display || (m.match_time ? m.match_time.slice(0, 5) + ' น.' : 'ไม่ระบุเวลา');

/**
 * "ตามเวลา": { [date]: { dateStr, totalMatches, timeSlots: { [label]: match[] } } } in date → time →
 * sport sort_order → match_number order.
 */
export function groupByTime(matches, sports) {
  const order = new Map(sports.map((s) => [s.id, s.sort_order || 0]));
  const sorted = [...matches].sort(
    (a, b) =>
      byDateTime(a, b) ||
      (order.get(a.sport_id) || 0) - (order.get(b.sport_id) || 0) ||
      (a.match_number || 0) - (b.match_number || 0)
  );
  const dates = {};
  for (const m of sorted) {
    const date = m.match_date || EVENT_START_DATE;
    dates[date] ||= { dateStr: date, totalMatches: 0, timeSlots: {} };
    dates[date].totalMatches++;
    (dates[date].timeSlots[timeSlotLabel(m)] ||= []).push(m);
  }
  return dates;
}

/** "ตามกีฬา": [{ sport, total, dates: { [date]: match[] } }] in sports order, unknown sports last. */
export function groupBySport(matches, sports) {
  const sorted = [...matches].sort(
    (a, b) => byDateTime(a, b) || (a.match_number || 0) - (b.match_number || 0)
  );
  const groups = new Map();
  for (const s of sports) groups.set(s.id, { sport: s, total: 0, dates: {} });
  groups.set('__other', { sport: null, total: 0, dates: {} });
  for (const m of sorted) {
    const g = groups.get(findSportFor(m, sports)?.id) || groups.get('__other');
    g.total++;
    (g.dates[m.match_date || EVENT_START_DATE] ||= []).push(m);
  }
  return Array.from(groups.values()).filter((g) => g.total > 0);
}
