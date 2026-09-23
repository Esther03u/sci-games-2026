-- ============================================================================
-- 008_lock_live_scores.sql — Sci Games 2026
--
-- Step 2 of 2 (see 007_matches_public_view.sql). Once every public page reads
-- `matches_public`, take the direct reads away from anon: `matches`,
-- `match_sets` and `score_events` all carry the live score, and a public anon
-- key could query them.
--
-- **Apply this only after the app that reads matches_public is deployed** —
-- the old code reads `matches` as anon and would render empty pages.
--
-- After this, reading those tables needs a Supabase session that belongs to
-- admin_users. Referees signed in with a PIN are `anon`, so their screens
-- (/staff/scoring) are served by the service-role API routes instead.
-- Service role bypasses RLS and is unaffected. Additive, idempotent.
-- ============================================================================

DROP POLICY IF EXISTS "public_read" ON matches;
DROP POLICY IF EXISTS "staff_read" ON matches;
CREATE POLICY "staff_read" ON matches FOR SELECT USING (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "public_read" ON match_sets;
DROP POLICY IF EXISTS "staff_read" ON match_sets;
CREATE POLICY "staff_read" ON match_sets FOR SELECT USING (get_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "public_read" ON score_events;
DROP POLICY IF EXISTS "staff_read" ON score_events;
CREATE POLICY "staff_read" ON score_events FOR SELECT USING (get_user_role() IS NOT NULL);
