import { getMatches, getRecentEvents, getSets, getSports, getTeams, rows } from './core';

export const EMPTY_LIVE = { sports: [], teams: [], matches: [], sets: [], events: [] };

/**
 * Initial data for the spectator live pages and the admin Live Monitor.
 * useLiveScores() takes over from here with realtime updates.
 *
 * `withEvents` adds the latest score_events (300 rows) — only the admin
 * monitor shows "who scored last", so spectator pages leave it off.
 */
export async function loadLiveData(sb, { withEvents = false } = {}) {
  const [sports, teams, matches, sets, events] = await Promise.all([
    getSports(sb),
    getTeams(sb),
    getMatches(sb),
    getSets(sb),
    withEvents ? getRecentEvents(sb) : null,
  ]);
  return { sports: rows(sports), teams: rows(teams), matches: rows(matches), sets: rows(sets), events: rows(events) };
}
