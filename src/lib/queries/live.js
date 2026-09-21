import { getMatches, getRecentEvents, getSets, getSports, getTeams, rows } from './core';

export const EMPTY_LIVE = { sports: [], teams: [], matches: [], sets: [], events: [] };

/**
 * Initial data for the spectator live pages and the admin Live Monitor.
 * useLiveScores() takes over from here with realtime updates.
 */
export async function loadLiveData(sb) {
  const [sports, teams, matches, sets, events] = await Promise.all([
    getSports(sb),
    getTeams(sb),
    getMatches(sb),
    getSets(sb),
    getRecentEvents(sb),
  ]);
  return { sports: rows(sports), teams: rows(teams), matches: rows(matches), sets: rows(sets), events: rows(events) };
}
