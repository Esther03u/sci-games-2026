-- ============================================================================
-- 015_unlock_realtime_scores.sql — Sci Games 2026
--
-- Unlocks live scores so spectators see realtime scores during match play.
--
-- 1) Re-grant SELECT on matches, match_sets, and score_events to anon
--    so Supabase Realtime WebSocket postgres_changes can broadcast live updates
--    to anonymous spectators without permission denied.
-- 2) Update matches_public_v2 and matches_public_v3 views so they return
--    the live scores (score_a, score_b, sets_a, sets_b, current_set, etc.)
--    instead of masking them to NULL while status = 'live'.
--
-- Additive and idempotent.
-- ============================================================================

-- Restore public SELECT policy for Realtime broadcasts
DROP POLICY IF EXISTS "public_read" ON matches;
CREATE POLICY "public_read" ON matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON match_sets;
CREATE POLICY "public_read" ON match_sets FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON score_events;
CREATE POLICY "public_read" ON score_events FOR SELECT USING (true);

-- Update public views without NULL masking for live matches
DROP VIEW IF EXISTS matches_public_v2;
CREATE VIEW matches_public_v2 AS
SELECT
  id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status,
  round, category, match_number, points_a, points_b,
  score_a, score_b, sets_a, sets_b, current_set, last_score_at, last_scored_team,
  next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
  started_at, finished_at, created_at, updated_at
FROM matches;
GRANT SELECT ON matches_public_v2 TO anon, authenticated;

DROP VIEW IF EXISTS matches_public_v3;
CREATE VIEW matches_public_v3 AS
SELECT
  id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status,
  round, category, match_number, points_a, points_b,
  score_a, score_b, sets_a, sets_b, current_set, last_score_at, last_scored_team,
  next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot,
  started_at, finished_at, created_at, updated_at,
  is_walkover
FROM matches;
GRANT SELECT ON matches_public_v3 TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
