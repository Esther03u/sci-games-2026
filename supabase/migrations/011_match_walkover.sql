-- ============================================================================
-- 011_match_walkover.sql — Sci Games 2026
--
-- Support for Walkover (ชนะบาย) when a team forfeits or fails to field athletes.
-- - is_walkover boolean on matches (default false)
-- - matches_public_v2 view updated to expose is_walkover (appended at end)
-- Additive and idempotent.
-- ============================================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS is_walkover boolean NOT NULL DEFAULT false;

CREATE OR REPLACE VIEW matches_public_v2 AS
SELECT
  id,
  sport_id,
  team_a_id,
  team_b_id,
  match_date,
  match_time,
  venue,
  court,
  status,
  round,
  category,
  match_number,
  points_a,
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
  updated_at,
  is_walkover
FROM matches;

GRANT SELECT ON matches_public_v2 TO anon, authenticated;
