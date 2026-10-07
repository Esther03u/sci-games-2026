import crypto from 'node:crypto';

/**
 * Computes a deterministic weak ETag from tournament summary data.
 *
 * @param {{
 *   matches?: Array<Record<string, any>>,
 *   sports?: Array<Record<string, any>>,
 *   teams?: Array<Record<string, any>>,
 * }} data
 * @returns {string} E.g. `W/"a1b2c3d4e5f60718"`
 */
export function generateSummaryEtag(data) {
  if (!data) return 'W/"empty"';
  const matches = (data.matches || []).map((m) => [
    m.id,
    m.sport_id,
    m.status,
    m.team_a_id,
    m.team_b_id,
    m.score_a,
    m.score_b,
    m.sets_a,
    m.sets_b,
    m.winner_team_id,
    m.match_date,
    m.match_time,
    m.court,
    m.is_walkover,
    m.finished_at,
  ]);
  const sports = (data.sports || []).map((s) => [s.id, s.name, s.sort_order]);
  const teams = (data.teams || []).map((t) => [t.id, t.name, t.sort_order]);

  const raw = JSON.stringify({ m: matches, s: sports, t: teams });
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16);
  return `W/"${hash}"`;
}
