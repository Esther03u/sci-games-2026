-- ============================================================================
-- 016_public_views_rerunnable.sql — Sci Games 2026
--
-- 015 recreated matches_public_v2 / v3 without the CASE masking, which also
-- changed the type of last_scored_team from bpchar (what a CASE yields) to
-- character(1). Re-running 010 / 011 / 013 then fails with
--   cannot change data type of view column "last_scored_team"
-- and the CI idempotency pass (supabase/tests/run-local.sh) stops there.
--
-- Same views, same rows and columns as 015 — live scores stay public — but
-- last_scored_team is cast back to bpchar so the older migrations' CREATE OR
-- REPLACE VIEW stays compatible ("v2 keeps 010's shape", see 013).
--
-- Additive and idempotent; no change in behaviour for the app.
-- ============================================================================

BEGIN;

DROP VIEW IF EXISTS matches_public_v2;
CREATE VIEW matches_public_v2 AS
SELECT
  id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status,
  round, category, match_number, points_a, points_b,
  score_a, score_b, sets_a, sets_b, current_set, last_score_at,
  last_scored_team::bpchar AS last_scored_team,
  next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
  started_at, finished_at, created_at, updated_at
FROM matches;
GRANT SELECT ON matches_public_v2 TO anon, authenticated;

DROP VIEW IF EXISTS matches_public_v3;
CREATE VIEW matches_public_v3 AS
SELECT
  id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status,
  round, category, match_number, points_a, points_b,
  score_a, score_b, sets_a, sets_b, current_set, last_score_at,
  last_scored_team::bpchar AS last_scored_team,
  next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
  started_at, finished_at, created_at, updated_at,
  is_walkover
FROM matches;
GRANT SELECT ON matches_public_v3 TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
