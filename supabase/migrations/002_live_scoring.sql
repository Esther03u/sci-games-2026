-- ============================================================================
-- 002_live_scoring.sql — Sci Games 2026
--
-- Runs on top of 001_initial_schema.sql. Additive and idempotent: safe to
-- re-run. Never edits 001 except for the policies/triggers named explicitly.
--
-- Sections
--   A. Security fixes from the 2026-09-20 audit
--   B. Audit-log triggers (admin writes made through the anon client + RLS)
--   C. Shared rate limiter for API routes
--   D. Live scoring schema (sets, score events, PINs, settings, bracket)
--   E. Scoring functions (called with the service role from /api/*)
--   F. Bracket auto-advance
--   G. Points / standings updated for set-based sports
--   H. RLS + Realtime for the new tables
-- ============================================================================


-- ============================================================================
-- A. SECURITY FIXES
-- ============================================================================

-- A1. athletes.phone was readable by anyone holding the anon key.
--     Public pages must use the athletes_public view (no phone column).
DROP POLICY IF EXISTS "public_read" ON athletes;

-- The view runs with the owner's privileges (security_invoker is off by
-- default), so anon/authenticated can still read it after the policy is gone.
GRANT SELECT ON athletes_public TO anon, authenticated;

-- A2. registrations.cancelled_by had no foreign key.
DO $$ BEGIN
  ALTER TABLE registrations
    ADD CONSTRAINT registrations_cancelled_by_fkey
    FOREIGN KEY (cancelled_by) REFERENCES admin_users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- A3. Staff could UPDATE any column of an assigned match (team, date, venue).
--     The "staff_update" policy stays for now (Phase 0 still scores through
--     the anon client); this trigger limits staff to score/status columns.
--     Phase 1 moves scoring to apply_score_event() and drops the policy.
CREATE OR REPLACE FUNCTION guard_staff_match_update()
RETURNS TRIGGER AS $$
BEGIN
  IF get_user_role() = 'staff' THEN
    IF NEW.sport_id   IS DISTINCT FROM OLD.sport_id
    OR NEW.team_a_id  IS DISTINCT FROM OLD.team_a_id
    OR NEW.team_b_id  IS DISTINCT FROM OLD.team_b_id
    OR NEW.match_date IS DISTINCT FROM OLD.match_date
    OR NEW.match_time IS DISTINCT FROM OLD.match_time
    OR NEW.venue      IS DISTINCT FROM OLD.venue
    OR NEW.points_a   IS DISTINCT FROM OLD.points_a
    OR NEW.points_b   IS DISTINCT FROM OLD.points_b
    THEN
      RAISE EXCEPTION 'staff may only change score and status'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_staff_match_update ON matches;
CREATE TRIGGER trg_guard_staff_match_update
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION guard_staff_match_update();


-- ============================================================================
-- B. AUDIT-LOG TRIGGERS
--    Admin/staff components write straight to Postgres through RLS, so the
--    only reliable place to record "who changed what" is the database.
--    Service-role writes (auth.uid() IS NULL) are skipped here — API routes
--    log those explicitly via createAuditLog().
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_change()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id uuid;
  v_target_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT id INTO v_admin_id FROM admin_users WHERE auth_user_id = auth.uid();
  IF v_admin_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;

  INSERT INTO audit_logs (admin_user_id, action, target_type, target_id, old_values, new_values)
  VALUES (
    v_admin_id,
    lower(TG_OP) || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    v_target_id,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_matches ON matches;
CREATE TRIGGER trg_audit_matches
  AFTER INSERT OR UPDATE OR DELETE ON matches
  FOR EACH ROW EXECUTE FUNCTION log_admin_change();

DROP TRIGGER IF EXISTS trg_audit_athletes ON athletes;
CREATE TRIGGER trg_audit_athletes
  AFTER UPDATE OR DELETE ON athletes
  FOR EACH ROW EXECUTE FUNCTION log_admin_change();

DROP TRIGGER IF EXISTS trg_audit_registrations ON registrations;
CREATE TRIGGER trg_audit_registrations
  AFTER UPDATE OR DELETE ON registrations
  FOR EACH ROW EXECUTE FUNCTION log_admin_change();

DROP TRIGGER IF EXISTS trg_audit_announcements ON announcements;
CREATE TRIGGER trg_audit_announcements
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION log_admin_change();

DROP TRIGGER IF EXISTS trg_audit_departments ON departments;
CREATE TRIGGER trg_audit_departments
  AFTER INSERT OR UPDATE OR DELETE ON departments
  FOR EACH ROW EXECUTE FUNCTION log_admin_change();

DROP TRIGGER IF EXISTS trg_audit_sport_schedules ON sport_schedules;
CREATE TRIGGER trg_audit_sport_schedules
  AFTER INSERT OR UPDATE OR DELETE ON sport_schedules
  FOR EACH ROW EXECUTE FUNCTION log_admin_change();

CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);


-- ============================================================================
-- C. RATE LIMITER (shared across serverless instances)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0
);

-- Fixed-window counter. Returns {"allowed": bool, "remaining": int}.
CREATE OR REPLACE FUNCTION check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS jsonb AS $$
DECLARE
  v_row rate_limits%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  INSERT INTO rate_limits (key, window_start, hits)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE
      WHEN rate_limits.window_start < v_now - make_interval(secs => p_window_seconds) THEN 1
      ELSE rate_limits.hits + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_now - make_interval(secs => p_window_seconds) THEN v_now
      ELSE rate_limits.window_start
    END
  RETURNING * INTO v_row;

  -- Opportunistic cleanup so the table never grows unbounded.
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE window_start < v_now - interval '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_row.hits <= p_limit,
    'remaining', GREATEST(p_limit - v_row.hits, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- D. LIVE SCORING SCHEMA
-- ============================================================================

-- D1. sports: how the sport is scored
ALTER TABLE sports
  ADD COLUMN IF NOT EXISTS scoring_type text NOT NULL DEFAULT 'points',
  ADD COLUMN IF NOT EXISTS sets_to_win integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS points_per_set integer,
  ADD COLUMN IF NOT EXISTS icon text;

DO $$ BEGIN
  ALTER TABLE sports ADD CONSTRAINT sports_scoring_type_check
    CHECK (scoring_type IN ('points', 'sets'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Matched by name so it works whether or not seed.sql has run.
-- Set rules (ตะกร้อ 2 ใน 3 เซตละ 21, เปตอง 13 แต้มเซตเดียว) are the plan's
-- defaults — adjust here if the official handbook says otherwise.
UPDATE sports SET scoring_type = 'sets', sets_to_win = 2, points_per_set = 25 WHERE name = 'วอลเลย์บอล';
UPDATE sports SET scoring_type = 'sets', sets_to_win = 2, points_per_set = 21 WHERE name = 'เซปักตะกร้อ';
UPDATE sports SET scoring_type = 'sets', sets_to_win = 1, points_per_set = 13 WHERE name = 'เปตอง';
UPDATE sports SET scoring_type = 'points' WHERE name IN ('ฟุตซอล', 'บาสเกตบอล');

-- D2. matches: set tracking, last-score metadata, bracket links
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS current_set integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sets_a integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sets_b integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_score_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_scored_team char(1),
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS round text,
  ADD COLUMN IF NOT EXISTS next_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_match_slot char(1),
  ADD COLUMN IF NOT EXISTS loser_next_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loser_next_match_slot char(1);

DO $$ BEGIN
  ALTER TABLE matches ADD CONSTRAINT matches_last_scored_team_check
    CHECK (last_scored_team IS NULL OR last_scored_team IN ('a', 'b'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE matches ADD CONSTRAINT matches_next_match_slot_check
    CHECK (next_match_slot IS NULL OR next_match_slot IN ('a', 'b'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE matches ADD CONSTRAINT matches_loser_next_match_slot_check
    CHECK (loser_next_match_slot IS NULL OR loser_next_match_slot IN ('a', 'b'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Bracket matches (final, 3rd place) are created before their teams are known.
-- The existing CHECK (team_a_id != team_b_id) is NULL-safe.
ALTER TABLE matches ALTER COLUMN team_a_id DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN team_b_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_sport_status ON matches(sport_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_next_match ON matches(next_match_id);

-- D3. per-set scores for set-based sports
CREATE TABLE IF NOT EXISTS match_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'finished')),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (match_id, set_number)
);
CREATE INDEX IF NOT EXISTS idx_match_sets_match ON match_sets(match_id, set_number);

-- D4. every score change is an event (audit trail + undo + viewer indicator)
CREATE TABLE IF NOT EXISTS score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number integer,
  team char(1) CHECK (team IS NULL OR team IN ('a', 'b')),
  delta integer NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'score'
    CHECK (event_type IN ('score', 'start', 'finish_set', 'finish_match', 'reopen', 'override', 'undo')),
  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'admin', 'pin')),
  actor_admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_pin_id uuid,
  actor_label text NOT NULL,
  undone_by uuid REFERENCES score_events(id) ON DELETE SET NULL,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_score_events_match ON score_events(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_events_created ON score_events(created_at DESC);

-- D5. per-sport PINs for temporary referees
CREATE TABLE IF NOT EXISTS sport_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  label text NOT NULL,
  pin_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sport_pins_sport ON sport_pins(sport_id) WHERE is_active;

DO $$ BEGIN
  ALTER TABLE score_events
    ADD CONSTRAINT score_events_actor_pin_id_fkey
    FOREIGN KEY (actor_pin_id) REFERENCES sport_pins(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- D6. runtime settings
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO app_settings (key, value) VALUES
  ('score_edit_window_minutes', '10'::jsonb),
  ('live_scoring_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION get_setting_int(p_key text, p_default integer)
RETURNS integer AS $$
  SELECT COALESCE((SELECT (value)::text::integer FROM app_settings WHERE key = p_key), p_default);
$$ LANGUAGE sql STABLE;


-- ============================================================================
-- E. SCORING FUNCTIONS
--    All take p_actor jsonb:
--      {"type":"admin"|"staff"|"pin", "admin_user_id":uuid|null,
--       "pin_id":uuid|null, "label":text}
--    Callers (API routes using the service role) are responsible for checking
--    that the actor is allowed to score the match's sport.
-- ============================================================================

-- Helper: winner of a match as 'a' | 'b' | NULL (draw / not decidable)
CREATE OR REPLACE FUNCTION match_winner(p_match matches)
RETURNS char(1) AS $$
DECLARE
  v_type text;
BEGIN
  SELECT scoring_type INTO v_type FROM sports WHERE id = p_match.sport_id;
  IF v_type = 'sets' THEN
    IF p_match.sets_a > p_match.sets_b THEN RETURN 'a';
    ELSIF p_match.sets_b > p_match.sets_a THEN RETURN 'b';
    END IF;
  ELSE
    IF COALESCE(p_match.score_a, 0) > COALESCE(p_match.score_b, 0) THEN RETURN 'a';
    ELSIF COALESCE(p_match.score_b, 0) > COALESCE(p_match.score_a, 0) THEN RETURN 'b';
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper: can this actor still change scores on this match?
CREATE OR REPLACE FUNCTION assert_match_editable(p_match matches, p_actor jsonb)
RETURNS void AS $$
DECLARE
  v_window integer;
BEGIN
  IF p_match.status = 'live' THEN
    RETURN;
  END IF;

  IF p_match.status = 'finished' THEN
    IF p_actor->>'type' = 'admin' THEN
      RETURN;
    END IF;
    v_window := get_setting_int('score_edit_window_minutes', 10);
    IF p_match.finished_at IS NOT NULL
       AND p_match.finished_at > now() - make_interval(mins => v_window) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'EDIT_WINDOW_CLOSED: match finished more than % minutes ago', v_window
      USING ERRCODE = 'check_violation';
  END IF;

  RAISE EXCEPTION 'MATCH_NOT_LIVE: match status is %', p_match.status
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION insert_score_event(
  p_match_id uuid, p_set integer, p_team char, p_delta integer,
  p_type text, p_actor jsonb, p_meta jsonb
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO score_events (
    match_id, set_number, team, delta, event_type,
    actor_type, actor_admin_user_id, actor_pin_id, actor_label, meta
  ) VALUES (
    p_match_id, p_set, p_team, p_delta, p_type,
    p_actor->>'type',
    NULLIF(p_actor->>'admin_user_id', '')::uuid,
    NULLIF(p_actor->>'pin_id', '')::uuid,
    COALESCE(p_actor->>'label', 'unknown'),
    p_meta
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- E1. start_match: upcoming/postponed -> live, opens set 1
CREATE OR REPLACE FUNCTION start_match(p_match_id uuid, p_actor jsonb)
RETURNS matches AS $$
DECLARE
  v_match matches;
  v_type text;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  IF v_match.status = 'live' THEN RETURN v_match; END IF;
  IF v_match.status = 'finished' THEN
    RAISE EXCEPTION 'MATCH_ALREADY_FINISHED' USING ERRCODE = 'check_violation';
  END IF;
  IF v_match.team_a_id IS NULL OR v_match.team_b_id IS NULL THEN
    RAISE EXCEPTION 'MATCH_TEAMS_NOT_SET' USING ERRCODE = 'check_violation';
  END IF;

  SELECT scoring_type INTO v_type FROM sports WHERE id = v_match.sport_id;

  UPDATE matches SET
    status = 'live',
    started_at = COALESCE(started_at, now()),
    score_a = COALESCE(score_a, 0),
    score_b = COALESCE(score_b, 0),
    current_set = 1,
    updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  IF v_type = 'sets' THEN
    INSERT INTO match_sets (match_id, set_number) VALUES (p_match_id, 1)
    ON CONFLICT (match_id, set_number) DO NOTHING;
  END IF;

  PERFORM insert_score_event(p_match_id, 1, NULL, 0, 'start', p_actor, NULL);
  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E2. apply_score_event: the +1 / -1 button
CREATE OR REPLACE FUNCTION apply_score_event(
  p_match_id uuid, p_team char, p_delta integer, p_actor jsonb
) RETURNS matches AS $$
DECLARE
  v_match matches;
  v_type text;
  v_from_a integer;
  v_from_b integer;
  v_new_a integer;
  v_new_b integer;
BEGIN
  IF p_team NOT IN ('a', 'b') THEN RAISE EXCEPTION 'INVALID_TEAM'; END IF;
  IF p_delta = 0 OR abs(p_delta) > 10 THEN RAISE EXCEPTION 'INVALID_DELTA'; END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  PERFORM assert_match_editable(v_match, p_actor);

  SELECT scoring_type INTO v_type FROM sports WHERE id = v_match.sport_id;

  v_from_a := COALESCE(v_match.score_a, 0);
  v_from_b := COALESCE(v_match.score_b, 0);
  v_new_a := v_from_a;
  v_new_b := v_from_b;
  IF p_team = 'a' THEN v_new_a := GREATEST(v_from_a + p_delta, 0);
  ELSE                 v_new_b := GREATEST(v_from_b + p_delta, 0);
  END IF;

  -- Nothing changed (e.g. -1 at 0): record nothing.
  IF v_new_a = v_from_a AND v_new_b = v_from_b THEN
    RETURN v_match;
  END IF;

  IF v_type = 'sets' THEN
    INSERT INTO match_sets (match_id, set_number, score_a, score_b)
    VALUES (p_match_id, v_match.current_set, v_new_a, v_new_b)
    ON CONFLICT (match_id, set_number) DO UPDATE
      SET score_a = EXCLUDED.score_a, score_b = EXCLUDED.score_b;
  END IF;

  UPDATE matches SET
    score_a = v_new_a,
    score_b = v_new_b,
    last_score_at = now(),
    last_scored_team = CASE WHEN p_delta > 0 THEN p_team ELSE last_scored_team END,
    updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  PERFORM insert_score_event(
    p_match_id, v_match.current_set, p_team, p_delta, 'score', p_actor,
    jsonb_build_object('from', jsonb_build_object('a', v_from_a, 'b', v_from_b),
                       'to',   jsonb_build_object('a', v_new_a,  'b', v_new_b))
  );
  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E3. finish_set: close the current set, open the next one unless decided
CREATE OR REPLACE FUNCTION finish_set(p_match_id uuid, p_actor jsonb)
RETURNS matches AS $$
DECLARE
  v_match matches;
  v_sport sports;
  v_a integer;
  v_b integer;
  v_sets_a integer;
  v_sets_b integer;
  v_decided boolean;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  PERFORM assert_match_editable(v_match, p_actor);

  SELECT * INTO v_sport FROM sports WHERE id = v_match.sport_id;
  IF v_sport.scoring_type <> 'sets' THEN
    RAISE EXCEPTION 'NOT_A_SET_SPORT' USING ERRCODE = 'check_violation';
  END IF;

  v_a := COALESCE(v_match.score_a, 0);
  v_b := COALESCE(v_match.score_b, 0);
  IF v_a = v_b THEN
    RAISE EXCEPTION 'SET_IS_TIED' USING ERRCODE = 'check_violation';
  END IF;

  UPDATE match_sets SET score_a = v_a, score_b = v_b, status = 'finished', finished_at = now()
  WHERE match_id = p_match_id AND set_number = v_match.current_set;
  IF NOT FOUND THEN
    INSERT INTO match_sets (match_id, set_number, score_a, score_b, status, finished_at)
    VALUES (p_match_id, v_match.current_set, v_a, v_b, 'finished', now());
  END IF;

  v_sets_a := v_match.sets_a + CASE WHEN v_a > v_b THEN 1 ELSE 0 END;
  v_sets_b := v_match.sets_b + CASE WHEN v_b > v_a THEN 1 ELSE 0 END;
  v_decided := v_sets_a >= v_sport.sets_to_win OR v_sets_b >= v_sport.sets_to_win;

  PERFORM insert_score_event(
    p_match_id, v_match.current_set, NULL, 0, 'finish_set', p_actor,
    jsonb_build_object('set_score', jsonb_build_object('a', v_a, 'b', v_b),
                       'sets', jsonb_build_object('a', v_sets_a, 'b', v_sets_b),
                       'decided', v_decided)
  );

  IF v_decided THEN
    -- Keep the final set's score visible; caller should now finish_match().
    UPDATE matches SET sets_a = v_sets_a, sets_b = v_sets_b,
      updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
    WHERE id = p_match_id RETURNING * INTO v_match;
  ELSE
    UPDATE matches SET sets_a = v_sets_a, sets_b = v_sets_b,
      current_set = current_set + 1, score_a = 0, score_b = 0,
      updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
    WHERE id = p_match_id RETURNING * INTO v_match;
    INSERT INTO match_sets (match_id, set_number) VALUES (p_match_id, v_match.current_set)
    ON CONFLICT (match_id, set_number) DO NOTHING;
  END IF;

  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E4. finish_match: live -> finished (points via trg_match_points, bracket via trg_advance_bracket)
CREATE OR REPLACE FUNCTION finish_match(p_match_id uuid, p_actor jsonb)
RETURNS matches AS $$
DECLARE
  v_match matches;
  v_sport sports;
  v_cur match_sets;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  IF v_match.status = 'finished' THEN RETURN v_match; END IF;
  IF v_match.status <> 'live' THEN
    RAISE EXCEPTION 'MATCH_NOT_LIVE' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_sport FROM sports WHERE id = v_match.sport_id;

  -- Set sport: close the current set if it is still open and has a leader.
  IF v_sport.scoring_type = 'sets' THEN
    SELECT * INTO v_cur FROM match_sets
    WHERE match_id = p_match_id AND set_number = v_match.current_set;
    IF (v_cur.id IS NULL OR v_cur.status = 'live')
       AND COALESCE(v_match.score_a, 0) <> COALESCE(v_match.score_b, 0) THEN
      v_match := finish_set(p_match_id, p_actor);
    END IF;
  END IF;

  UPDATE matches SET
    status = 'finished',
    finished_at = now(),
    score_a = COALESCE(score_a, 0),
    score_b = COALESCE(score_b, 0),
    updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  PERFORM insert_score_event(
    p_match_id, v_match.current_set, NULL, 0, 'finish_match', p_actor,
    jsonb_build_object('score', jsonb_build_object('a', v_match.score_a, 'b', v_match.score_b),
                       'sets',  jsonb_build_object('a', v_match.sets_a,  'b', v_match.sets_b),
                       'winner', match_winner(v_match))
  );
  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E5. reopen_match: admin only, finished -> live
CREATE OR REPLACE FUNCTION reopen_match(p_match_id uuid, p_actor jsonb)
RETURNS matches AS $$
DECLARE v_match matches;
BEGIN
  IF p_actor->>'type' <> 'admin' THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  IF v_match.status <> 'finished' THEN RETURN v_match; END IF;

  UPDATE matches SET
    status = 'live', finished_at = NULL, points_a = 0, points_b = 0,
    updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
  WHERE id = p_match_id RETURNING * INTO v_match;

  PERFORM insert_score_event(p_match_id, v_match.current_set, NULL, 0, 'reopen', p_actor, NULL);
  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E6. override_score: admin sets scores directly (e.g. after a dispute)
CREATE OR REPLACE FUNCTION override_score(
  p_match_id uuid, p_score_a integer, p_score_b integer,
  p_sets_a integer, p_sets_b integer, p_actor jsonb
) RETURNS matches AS $$
DECLARE v_match matches; v_old jsonb;
BEGIN
  IF p_actor->>'type' <> 'admin' THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;

  v_old := jsonb_build_object('a', v_match.score_a, 'b', v_match.score_b,
                              'sets_a', v_match.sets_a, 'sets_b', v_match.sets_b);

  UPDATE matches SET
    score_a = GREATEST(COALESCE(p_score_a, score_a, 0), 0),
    score_b = GREATEST(COALESCE(p_score_b, score_b, 0), 0),
    sets_a  = GREATEST(COALESCE(p_sets_a, sets_a), 0),
    sets_b  = GREATEST(COALESCE(p_sets_b, sets_b), 0),
    last_score_at = now(),
    updated_by = NULLIF(p_actor->>'admin_user_id', '')::uuid
  WHERE id = p_match_id RETURNING * INTO v_match;

  UPDATE match_sets SET score_a = v_match.score_a, score_b = v_match.score_b
  WHERE match_id = p_match_id AND set_number = v_match.current_set;

  PERFORM insert_score_event(
    p_match_id, v_match.current_set, NULL, 0, 'override', p_actor,
    jsonb_build_object('from', v_old,
                       'to', jsonb_build_object('a', v_match.score_a, 'b', v_match.score_b,
                                                'sets_a', v_match.sets_a, 'sets_b', v_match.sets_b))
  );
  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E7. undo_score_event: reverse one 'score' event by applying the inverse delta
CREATE OR REPLACE FUNCTION undo_score_event(p_event_id uuid, p_actor jsonb)
RETURNS matches AS $$
DECLARE
  v_event score_events;
  v_match matches;
  v_undo_id uuid;
BEGIN
  SELECT * INTO v_event FROM score_events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF v_event.event_type <> 'score' THEN
    RAISE EXCEPTION 'ONLY_SCORE_EVENTS_CAN_BE_UNDONE' USING ERRCODE = 'check_violation';
  END IF;
  IF v_event.undone_by IS NOT NULL THEN
    RAISE EXCEPTION 'EVENT_ALREADY_UNDONE' USING ERRCODE = 'check_violation';
  END IF;

  -- Non-admins may only undo their own events
  IF p_actor->>'type' <> 'admin' THEN
    IF (v_event.actor_admin_user_id IS DISTINCT FROM NULLIF(p_actor->>'admin_user_id', '')::uuid)
       OR (v_event.actor_pin_id IS DISTINCT FROM NULLIF(p_actor->>'pin_id', '')::uuid) THEN
      RAISE EXCEPTION 'CANNOT_UNDO_OTHERS_EVENT' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = v_event.match_id FOR UPDATE;
  IF v_match.current_set <> COALESCE(v_event.set_number, v_match.current_set) THEN
    RAISE EXCEPTION 'EVENT_FROM_PREVIOUS_SET' USING ERRCODE = 'check_violation';
  END IF;

  v_match := apply_score_event(v_event.match_id, v_event.team, -v_event.delta, p_actor);

  SELECT id INTO v_undo_id FROM score_events
  WHERE match_id = v_event.match_id ORDER BY created_at DESC LIMIT 1;
  UPDATE score_events SET event_type = 'undo', meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object('undoes', p_event_id)
  WHERE id = v_undo_id;
  UPDATE score_events SET undone_by = v_undo_id WHERE id = p_event_id;

  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- F. BRACKET
-- ============================================================================

-- F1. auto-advance winner/loser when a bracket match finishes
CREATE OR REPLACE FUNCTION advance_bracket()
RETURNS TRIGGER AS $$
DECLARE
  v_winner char(1);
  v_winner_id uuid;
  v_loser_id uuid;
BEGIN
  IF NEW.status <> 'finished' OR OLD.status = 'finished' THEN
    RETURN NEW;
  END IF;
  IF NEW.next_match_id IS NULL AND NEW.loser_next_match_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_winner := match_winner(NEW);
  IF v_winner IS NULL THEN
    RAISE NOTICE 'advance_bracket: match % ended in a draw, not advancing', NEW.id;
    RETURN NEW;
  END IF;

  v_winner_id := CASE WHEN v_winner = 'a' THEN NEW.team_a_id ELSE NEW.team_b_id END;
  v_loser_id  := CASE WHEN v_winner = 'a' THEN NEW.team_b_id ELSE NEW.team_a_id END;

  IF NEW.next_match_id IS NOT NULL THEN
    IF NEW.next_match_slot = 'a' THEN
      UPDATE matches SET team_a_id = v_winner_id WHERE id = NEW.next_match_id;
    ELSE
      UPDATE matches SET team_b_id = v_winner_id WHERE id = NEW.next_match_id;
    END IF;
  END IF;

  IF NEW.loser_next_match_id IS NOT NULL THEN
    IF NEW.loser_next_match_slot = 'a' THEN
      UPDATE matches SET team_a_id = v_loser_id WHERE id = NEW.loser_next_match_id;
    ELSE
      UPDATE matches SET team_b_id = v_loser_id WHERE id = NEW.loser_next_match_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_advance_bracket ON matches;
CREATE TRIGGER trg_advance_bracket
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  EXECUTE FUNCTION advance_bracket();

-- F2. generate_bracket: 4 teams -> semi_1 (seed1 v seed4), semi_2 (seed2 v seed3), third, final
--   p_opts: {"seeds":[uuid,uuid,uuid,uuid],
--            "semi_date":"2026-10-10","semi_time_1":"10:00","semi_time_2":"11:00",
--            "final_date":"2026-10-11","third_time":"13:00","final_time":"14:00",
--            "venue":"..."}
CREATE OR REPLACE FUNCTION generate_bracket(p_sport_id uuid, p_opts jsonb, p_actor jsonb)
RETURNS jsonb AS $$
DECLARE
  v_seeds uuid[];
  v_final uuid;
  v_third uuid;
  v_semi1 uuid;
  v_semi2 uuid;
  v_venue text;
BEGIN
  IF p_actor->>'type' <> 'admin' THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF EXISTS (SELECT 1 FROM matches WHERE sport_id = p_sport_id AND round IS NOT NULL) THEN
    RAISE EXCEPTION 'BRACKET_ALREADY_EXISTS' USING ERRCODE = 'unique_violation';
  END IF;

  SELECT array_agg(x::uuid) INTO v_seeds FROM jsonb_array_elements_text(p_opts->'seeds') AS x;
  IF v_seeds IS NULL OR array_length(v_seeds, 1) <> 4
     OR (SELECT count(DISTINCT s) FROM unnest(v_seeds) s) <> 4 THEN
    RAISE EXCEPTION 'BRACKET_NEEDS_4_DISTINCT_SEEDS' USING ERRCODE = 'check_violation';
  END IF;

  v_venue := COALESCE(p_opts->>'venue', 'TBA');

  INSERT INTO matches (sport_id, match_date, match_time, venue, round)
  VALUES (p_sport_id, (p_opts->>'final_date')::date, (p_opts->>'final_time')::time, v_venue, 'final')
  RETURNING id INTO v_final;

  INSERT INTO matches (sport_id, match_date, match_time, venue, round)
  VALUES (p_sport_id, (p_opts->>'final_date')::date, (p_opts->>'third_time')::time, v_venue, 'third')
  RETURNING id INTO v_third;

  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue, round,
                       next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot)
  VALUES (p_sport_id, v_seeds[1], v_seeds[4], (p_opts->>'semi_date')::date, (p_opts->>'semi_time_1')::time,
          v_venue, 'semi_1', v_final, 'a', v_third, 'a')
  RETURNING id INTO v_semi1;

  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue, round,
                       next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot)
  VALUES (p_sport_id, v_seeds[2], v_seeds[3], (p_opts->>'semi_date')::date, (p_opts->>'semi_time_2')::time,
          v_venue, 'semi_2', v_final, 'b', v_third, 'b')
  RETURNING id INTO v_semi2;

  RETURN jsonb_build_object('semi_1', v_semi1, 'semi_2', v_semi2, 'third', v_third, 'final', v_final);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- G. POINTS & STANDINGS — sets-aware
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_match_points()
RETURNS TRIGGER AS $$
DECLARE
  sport_record RECORD;
  v_winner char(1);
BEGIN
  IF NEW.status = 'finished' THEN
    SELECT win_points, draw_points, lose_points, scoring_type INTO sport_record
    FROM sports WHERE id = NEW.sport_id;

    IF sport_record.scoring_type = 'sets' THEN
      IF NEW.sets_a > NEW.sets_b THEN v_winner := 'a';
      ELSIF NEW.sets_b > NEW.sets_a THEN v_winner := 'b';
      END IF;
    ELSIF NEW.score_a IS NOT NULL AND NEW.score_b IS NOT NULL THEN
      IF NEW.score_a > NEW.score_b THEN v_winner := 'a';
      ELSIF NEW.score_b > NEW.score_a THEN v_winner := 'b';
      END IF;
    ELSE
      NEW.updated_at := now();
      RETURN NEW;
    END IF;

    IF v_winner = 'a' THEN
      NEW.points_a := COALESCE(sport_record.win_points, 3);
      NEW.points_b := COALESCE(sport_record.lose_points, 0);
    ELSIF v_winner = 'b' THEN
      NEW.points_a := COALESCE(sport_record.lose_points, 0);
      NEW.points_b := COALESCE(sport_record.win_points, 3);
    ELSE
      NEW.points_a := COALESCE(sport_record.draw_points, 1);
      NEW.points_b := COALESCE(sport_record.draw_points, 1);
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger trg_match_points from 001 still points at this function.

CREATE OR REPLACE VIEW team_standings AS
WITH finished AS (
  SELECT m.*,
    CASE
      WHEN s.scoring_type = 'sets' THEN
        CASE WHEN m.sets_a > m.sets_b THEN 'a' WHEN m.sets_b > m.sets_a THEN 'b' END
      ELSE
        CASE WHEN m.score_a > m.score_b THEN 'a' WHEN m.score_b > m.score_a THEN 'b' END
    END AS winner
  FROM matches m
  JOIN sports s ON s.id = m.sport_id
  WHERE m.status = 'finished'
)
SELECT
  t.id,
  t.name,
  t.color_hex,
  t.logo_emoji,
  t.sort_order,
  COALESCE(SUM(
    CASE
      WHEN f.team_a_id = t.id THEN f.points_a
      WHEN f.team_b_id = t.id THEN f.points_b
      ELSE 0
    END
  ), 0)::integer AS total_points,
  COUNT(f.id)::integer AS matches_played,
  COUNT(CASE WHEN (f.team_a_id = t.id AND f.winner = 'a')
              OR (f.team_b_id = t.id AND f.winner = 'b') THEN 1 END)::integer AS wins,
  COUNT(CASE WHEN f.winner IS NULL THEN 1 END)::integer AS draws,
  COUNT(CASE WHEN (f.team_a_id = t.id AND f.winner = 'b')
              OR (f.team_b_id = t.id AND f.winner = 'a') THEN 1 END)::integer AS losses
FROM teams t
LEFT JOIN finished f ON (f.team_a_id = t.id OR f.team_b_id = t.id)
GROUP BY t.id, t.name, t.color_hex, t.logo_emoji, t.sort_order
ORDER BY total_points DESC, wins DESC, t.sort_order;

GRANT SELECT ON team_standings TO anon, authenticated;


-- ============================================================================
-- H. RLS + REALTIME FOR NEW TABLES
-- ============================================================================

ALTER TABLE match_sets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_pins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits  ENABLE ROW LEVEL SECURITY;

-- Spectators read sets and events; nobody writes them except the service role.
DROP POLICY IF EXISTS "public_read" ON match_sets;
CREATE POLICY "public_read" ON match_sets FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON score_events;
CREATE POLICY "public_read" ON score_events FOR SELECT USING (true);

-- Admin manages PINs and settings via API (service role); read access here
-- lets the admin dashboard list them through the anon client.
DROP POLICY IF EXISTS "admin_read" ON sport_pins;
CREATE POLICY "admin_read" ON sport_pins FOR SELECT USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_all" ON app_settings;
CREATE POLICY "admin_all" ON app_settings FOR ALL USING (get_user_role() = 'super_admin');

-- rate_limits: service role only (no policies).

-- Scoring functions are SECURITY DEFINER and must only be reachable through
-- the service role (API routes), never from the anon/authenticated clients.
REVOKE EXECUTE ON FUNCTION start_match(uuid, jsonb)                              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION apply_score_event(uuid, char, integer, jsonb)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION finish_set(uuid, jsonb)                               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION finish_match(uuid, jsonb)                             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION reopen_match(uuid, jsonb)                             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION override_score(uuid, integer, integer, integer, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION undo_score_event(uuid, jsonb)                         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION generate_bracket(uuid, jsonb, jsonb)                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, integer, integer)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION insert_score_event(uuid, integer, char, integer, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE match_sets;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE score_events;
EXCEPTION WHEN duplicate_object THEN null; END $$;
