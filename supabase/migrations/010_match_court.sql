-- ============================================================================
-- 010_match_court.sql — Sci Games 2026
--
-- Petanque is played on four courts side by side ("สนามเปตอง สนาม 1–4"),
-- but `matches` had only `venue`, so the seeder stored "สนาม 1" as the venue
-- and nothing said it was the petanque ground. Add a `court` column for the
-- court inside a venue; the other sports leave it NULL.
--
-- Public reads move to `matches_public_v2` (= 007's masking + `court`).
-- 007's view cannot simply gain the column: `CREATE OR REPLACE VIEW` refuses
-- to drop columns, so re-running 007 after it grew one would fail. The old
-- view stays as it was and nothing new reads it.
--
-- Apply before deploying the app that reads matches_public_v2.
-- Additive, idempotent.
-- ============================================================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS court text;

-- Rows seeded before this migration: venue = 'สนาม N' → venue 'สนามเปตอง', court 'สนาม N'.
UPDATE matches m
   SET court = m.venue,
       venue = 'สนามเปตอง'
  FROM sports s
 WHERE s.id = m.sport_id
   AND s.name = 'เปตอง'
   AND m.court IS NULL
   AND m.venue ~ '^สนาม [0-9]+$';

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

GRANT SELECT ON matches_public_v2 TO anon, authenticated;
