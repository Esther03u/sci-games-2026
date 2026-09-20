-- ============================================================================
-- 003_staff_via_api_only.sql — Sci Games 2026
--
-- Phase 1 moved all staff scoring to /api/score and friends (service role +
-- SECURITY DEFINER functions from 002). Staff accounts therefore no longer
-- need any direct UPDATE access to matches, so the RLS policy from 001 and
-- the interim column guard from 002 are removed.
--
-- Idempotent; safe to re-run.
-- ============================================================================

DROP POLICY IF EXISTS "staff_update" ON matches;

DROP TRIGGER IF EXISTS trg_guard_staff_match_update ON matches;
DROP FUNCTION IF EXISTS guard_staff_match_update();

-- is_staff_for_sport() from 001 is no longer referenced by any policy but is
-- kept: harmless, and handy for ad-hoc queries in the SQL editor.
