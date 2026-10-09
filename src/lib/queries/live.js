import { getMatches, getPublicMatches, getRecentEvents, getSets, getSports, getTeams, rows } from './core';

/** @typedef {import('@/lib/types').LiveData} LiveData */

/** @type {LiveData} */
export const EMPTY_LIVE = { sports: [], teams: [], matches: [], sets: [], events: [] };

/**
 * Initial data for the spectator live pages and the admin Live Monitor.
 * useLiveScores() takes over from here with realtime updates.
 *
 * `withEvents` adds the latest score_events (300 rows) — only the admin
 * monitor shows "who scored last", so spectator pages leave it off.
 *
 * `publicView` reads `matches_public_v3`; since migration 015 live scores and
 * match_sets are public, so the set rows come along for the set-score display.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {{ withEvents?: boolean, publicView?: boolean }} [opts]
 * @returns {Promise<LiveData>}
 */
export async function loadLiveData(sb, { withEvents = false, publicView = false } = {}) {
  const [sports, teams, matches, sets, events] = await Promise.all([
    getSports(sb),
    getTeams(sb),
    publicView ? getPublicMatches(sb) : getMatches(sb),
    getSets(sb), // anon may read match_sets since migration 015
    withEvents ? getRecentEvents(sb) : null,
  ]);
  return {
    sports: rows(sports),
    teams: rows(teams),
    matches: rows(matches),
    sets: rows(sets),
    events: rows(events),
  };
}
