/** @typedef {import('@/lib/types').Match} Match */

/**
 * Same masking as the `matches_public_v3` view (migrations 007/010/013): a match that is
 * being played reveals no score to spectators — not through the page, not
 * through the API. Referees, staff and admins get the row untouched.
 *
 * Kept in JS (not only in SQL) because the route reads with the service role,
 * which bypasses RLS.
 *
 * @param {Match & { match_sets?: unknown[] }} row
 * @returns {Match & { match_sets?: unknown[] }}
 */
export function maskLiveMatch(row) {
  if (!row || row.status !== 'live') return row;
  return {
    ...row,
    score_a: null,
    score_b: null,
    sets_a: null,
    sets_b: null,
    current_set: null,
    last_score_at: null,
    last_scored_team: null,
    ...(Array.isArray(row.match_sets) ? { match_sets: [] } : {}),
  };
}
