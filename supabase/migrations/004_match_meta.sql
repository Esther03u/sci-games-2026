-- ============================================================================
-- 004_match_meta.sql — Sci Games 2026
--
-- Two display-only columns the official handbook schedule carries and the
-- public match cards already render (MatchCard shows `category`, the
-- schedule sorts by `match_number`). Needed so scripts/seed-matches.mjs can
-- import the handbook without losing information. Additive, idempotent.
-- ============================================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS category text,          -- 'ชาย' | 'หญิง' | 'ผสม' | NULL
  ADD COLUMN IF NOT EXISTS match_number integer;   -- order within the sport (คู่ที่ N)

CREATE INDEX IF NOT EXISTS idx_matches_sport_number ON matches(sport_id, match_number);
