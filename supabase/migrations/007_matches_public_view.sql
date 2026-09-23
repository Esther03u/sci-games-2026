-- ============================================================================
-- 007_hide_live_scores.sql — Sci Games 2026
--
-- Spectators must not see the score of a match while it is being played
-- (decision 2026-09-22): /results shows only "กำลังแข่ง" until the referee
-- finishes the match. Hiding it in the UI was not enough — `matches`,
-- `match_sets` and `score_events` were all readable by `anon`, so the score
-- was in the page payload and one query with the public anon key away.
--
-- Step 1 of 2: add the masked view only. Nothing changes for existing code,
-- so this can be applied to a running site safely; 008 takes the direct
-- reads away once the app is deployed and reading this view.
-- Additive, idempotent.
-- ============================================================================

-- Live-safe projection of matches. The view runs with owner rights (no
-- security_invoker), so it can read the table the caller no longer can.
CREATE OR REPLACE VIEW matches_public AS
SELECT
  id,
  sport_id,
  team_a_id,
  team_b_id,
  match_date,
  match_time,
  venue,
  status,
  round,
  category,
  match_number,
  points_a,                                                    -- league points, awarded on finish
  points_b,
  CASE WHEN status = 'live' THEN NULL ELSE score_a END AS score_a,
  CASE WHEN status = 'live' THEN NULL ELSE score_b END AS score_b,
  CASE WHEN status = 'live' THEN NULL ELSE sets_a END AS sets_a,
  CASE WHEN status = 'live' THEN NULL ELSE sets_b END AS sets_b,
  CASE WHEN status = 'live' THEN NULL ELSE current_set END AS current_set,
  CASE WHEN status = 'live' THEN NULL ELSE last_score_at END AS last_score_at,
  CASE WHEN status = 'live' THEN NULL ELSE last_scored_team END AS last_scored_team,
  next_match_id,
  next_match_slot,
  loser_next_match_id,
  loser_next_match_slot,
  started_at,
  finished_at,
  created_at,
  updated_at
FROM matches;

GRANT SELECT ON matches_public TO anon, authenticated;
