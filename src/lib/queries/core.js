// Shared read queries used by server pages and hooks. Every function takes a
// Supabase client (server, browser or service-role) so callers decide the
// auth context; results are `{ data, error }` from supabase-js unless noted.

export const getSports = (sb, cols = '*') => sb.from('sports').select(cols).order('sort_order');
export const getTeams = (sb, cols = '*') => sb.from('teams').select(cols).order('sort_order');

/**
 * Public projection of matches (migration 007): scores are NULL while a match
 * is live. Anything a spectator can reach must read this, not `matches` —
 * anon has no SELECT on the table itself.
 */
export const getPublicMatches = (sb, cols = '*') =>
  sb.from('matches_public').select(cols).order('match_date').order('match_time');

/** All matches in schedule order (date, time). Staff/admin only since 007. */
export const getMatches = (sb, cols = '*') =>
  sb.from('matches').select(cols).order('match_date').order('match_time');

/** Bracket matches only (rows created by generate_bracket). */
export const getBracketMatches = (sb) =>
  sb.from('matches').select('*').not('round', 'is', null).order('match_date').order('match_time');

export const getSets = (sb) => sb.from('match_sets').select('*').order('set_number');

export const getRecentEvents = (sb, limit = 300) =>
  sb.from('score_events').select('*').order('created_at', { ascending: false }).limit(limit);

export const getAnnouncements = (sb, { limit, orderBy = 'published_at' } = {}) => {
  let q = sb
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order(orderBy, { ascending: false });
  if (limit) q = q.limit(limit);
  return q;
};

export const getStandings = (sb) => sb.from('team_standings').select('*');

/** Unwrap `{ data }` → data or a fallback; keeps pages free of `?.data ||` noise. */
export const rows = (res, fallback = []) => res?.data ?? fallback;
