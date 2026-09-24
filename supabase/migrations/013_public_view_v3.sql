-- ============================================================================
-- 013_public_view_v3.sql — Sci Games 2026
--
-- 011 appended `is_walkover` to matches_public_v2. That works once, but a
-- re-run of 010 (every migration must be re-runnable; CI's DB job does it)
-- then fails: `CREATE OR REPLACE VIEW` cannot drop the column 010 does not
-- list. CI's "migrations + DB scenario" job has been red since 011.
--
-- 010/011 are applied on production and must not be edited, so:
--   * matches_public_v2 goes back to exactly 010's shape (DROP + CREATE —
--     re-running 010 and 011 after this works again),
--   * matches_public_v3 = v2 + is_walkover, and the app reads v3.
-- Same masking as 007: scores are NULL while a match is live.
--
-- Safe order on production: this migration first (the running app already
-- falls back when is_walkover is missing from the view), then deploy.
-- Additive for the app, idempotent.
-- ============================================================================

DROP VIEW IF EXISTS matches_public_v2;
CREATE VIEW matches_public_v2 AS
SELECT
  id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status,
  round, category, match_number, points_a, points_b,
  CASE WHEN status = 'live' THEN NULL ELSE score_a END AS score_a,
  CASE WHEN status = 'live' THEN NULL ELSE score_b END AS score_b,
  CASE WHEN status = 'live' THEN NULL ELSE sets_a END AS sets_a,
  CASE WHEN status = 'live' THEN NULL ELSE sets_b END AS sets_b,
  CASE WHEN status = 'live' THEN NULL ELSE current_set END AS current_set,
  CASE WHEN status = 'live' THEN NULL ELSE last_score_at END AS last_score_at,
  CASE WHEN status = 'live' THEN NULL ELSE last_scored_team END AS last_scored_team,
  next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
  started_at, finished_at, created_at, updated_at
FROM matches;
GRANT SELECT ON matches_public_v2 TO anon, authenticated;

-- New columns for spectators go into a new view (v4, …), never onto v3 —
-- see the note above.
CREATE OR REPLACE VIEW matches_public_v3 AS
SELECT
  id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status,
  round, category, match_number, points_a, points_b,
  CASE WHEN status = 'live' THEN NULL ELSE score_a END AS score_a,
  CASE WHEN status = 'live' THEN NULL ELSE score_b END AS score_b,
  CASE WHEN status = 'live' THEN NULL ELSE sets_a END AS sets_a,
  CASE WHEN status = 'live' THEN NULL ELSE sets_b END AS sets_b,
  CASE WHEN status = 'live' THEN NULL ELSE current_set END AS current_set,
  CASE WHEN status = 'live' THEN NULL ELSE last_score_at END AS last_score_at,
  CASE WHEN status = 'live' THEN NULL ELSE last_scored_team END AS last_scored_team,
  next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
  started_at, finished_at, created_at, updated_at,
  is_walkover
FROM matches;
GRANT SELECT ON matches_public_v3 TO anon, authenticated;
