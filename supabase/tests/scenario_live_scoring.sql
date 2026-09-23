-- Scenario test for 002_live_scoring.sql. Run after 001 + seed + 002 on a
-- scratch database (see supabase/tests/run-local.sh). Every block raises on
-- failure, so a clean run = pass.
\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------- fixtures
INSERT INTO admin_users (id, auth_user_id, display_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Admin One', 'super_admin'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Staff Futsal', 'staff');
INSERT INTO staff_sport_assignments (admin_user_id, sport_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111');

\echo '--- sports scoring config after 002'
SELECT name, scoring_type, sets_to_win, points_per_set FROM sports ORDER BY sort_order;

-- ------------------------------------------------ 1. points sport (futsal)
DO $$
DECLARE
  v_admin jsonb := '{"type":"admin","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000001","label":"Admin One"}';
  v_staff jsonb := '{"type":"staff","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000002","label":"Staff Futsal"}';
  v_pin   jsonb := '{"type":"pin","pin_id":null,"label":"PIN Futsal #1"}';
  m matches;
  ev uuid;
BEGIN
  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue)
  VALUES ('a1111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
          '2026-10-09', '17:30', 'สนามฟุตซอล') RETURNING * INTO m;

  -- cannot score before start
  BEGIN
    PERFORM apply_score_event(m.id, 'a', 1, v_staff);
    RAISE EXCEPTION 'expected MATCH_NOT_LIVE';
  EXCEPTION WHEN check_violation THEN NULL; END;

  m := start_match(m.id, v_staff);
  ASSERT m.status = 'live', 'status should be live';
  ASSERT m.score_a = 0 AND m.score_b = 0, 'scores start at 0';

  m := apply_score_event(m.id, 'a', 1, v_staff);
  m := apply_score_event(m.id, 'a', 1, v_pin);
  m := apply_score_event(m.id, 'b', 1, v_staff);
  ASSERT m.score_a = 2 AND m.score_b = 1, format('expected 2-1, got %s-%s', m.score_a, m.score_b);
  ASSERT m.last_scored_team = 'b', 'last_scored_team should be b';
  ASSERT m.last_score_at IS NOT NULL, 'last_score_at set';

  -- -1 does not change last_scored_team, and cannot go below 0
  m := apply_score_event(m.id, 'b', -1, v_staff);
  ASSERT m.score_b = 0, 'b back to 0';
  ASSERT m.last_scored_team = 'b', 'last_scored_team unchanged by decrement';
  m := apply_score_event(m.id, 'b', -1, v_staff);
  ASSERT m.score_b = 0, 'never negative';
  ASSERT (SELECT count(*) FROM score_events WHERE match_id = m.id AND event_type = 'score') = 4,
    'no-op decrement must not create an event';

  -- undo: staff may undo own event, not others'
  SELECT id INTO ev FROM score_events WHERE match_id = m.id AND actor_type = 'pin' LIMIT 1;
  BEGIN
    PERFORM undo_score_event(ev, v_staff);
    RAISE EXCEPTION 'expected CANNOT_UNDO_OTHERS_EVENT';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  m := undo_score_event(ev, v_admin);
  ASSERT m.score_a = 1, format('after undo a should be 1, got %s', m.score_a);
  ASSERT (SELECT undone_by FROM score_events WHERE id = ev) IS NOT NULL, 'event marked undone';
  BEGIN
    PERFORM undo_score_event(ev, v_admin);
    RAISE EXCEPTION 'expected EVENT_ALREADY_UNDONE';
  EXCEPTION WHEN check_violation THEN NULL; END;

  m := apply_score_event(m.id, 'a', 2, v_staff);   -- 3-0
  m := finish_match(m.id, v_staff);
  ASSERT m.status = 'finished' AND m.finished_at IS NOT NULL, 'finished';
  ASSERT m.points_a = 3 AND m.points_b = 0, format('points should be 3/0, got %s/%s', m.points_a, m.points_b);

  -- edit window: staff still allowed right after finish
  m := apply_score_event(m.id, 'b', 1, v_staff);
  ASSERT m.score_b = 1, 'staff edit inside window';

  -- simulate window expiry
  UPDATE matches SET finished_at = now() - interval '11 minutes' WHERE id = m.id;
  BEGIN
    PERFORM apply_score_event(m.id, 'b', 1, v_staff);
    RAISE EXCEPTION 'expected EDIT_WINDOW_CLOSED';
  EXCEPTION WHEN check_violation THEN NULL; END;
  -- admin always allowed
  m := apply_score_event(m.id, 'b', 1, v_admin);
  ASSERT m.score_b = 2, 'admin edit after window';

  -- staff cannot reopen, admin can
  BEGIN
    PERFORM reopen_match(m.id, v_staff);
    RAISE EXCEPTION 'expected ADMIN_ONLY';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  m := reopen_match(m.id, v_admin);
  ASSERT m.status = 'live' AND m.finished_at IS NULL AND m.points_a = 0, 'reopened';
  m := finish_match(m.id, v_admin);
  ASSERT m.points_a = 3, 'points recomputed after re-finish';

  RAISE NOTICE 'points sport: OK';
END $$;

-- ------------------------------------------------ 2. sets sport (volleyball)
DO $$
DECLARE
  v_staff jsonb := '{"type":"staff","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000002","label":"Staff"}';
  m matches;
  i int;
BEGIN
  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue)
  VALUES ('a2222222-2222-2222-2222-222222222222',
          '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
          '2026-10-10', '10:00', 'โรงยิม') RETURNING * INTO m;

  m := start_match(m.id, v_staff);
  ASSERT (SELECT count(*) FROM match_sets WHERE match_id = m.id) = 1, 'set 1 opened';

  -- tied set cannot be closed
  BEGIN
    PERFORM finish_set(m.id, v_staff);
    RAISE EXCEPTION 'expected SET_IS_TIED';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- set 1: a wins 25-20
  FOR i IN 1..25 LOOP m := apply_score_event(m.id, 'a', 1, v_staff); END LOOP;
  FOR i IN 1..20 LOOP m := apply_score_event(m.id, 'b', 1, v_staff); END LOOP;
  m := finish_set(m.id, v_staff);
  ASSERT m.sets_a = 1 AND m.sets_b = 0, 'sets 1-0';
  ASSERT m.current_set = 2 AND m.score_a = 0 AND m.score_b = 0, 'set 2 opened with 0-0';
  ASSERT (SELECT score_a || '-' || score_b FROM match_sets WHERE match_id = m.id AND set_number = 1) = '25-20',
    'set 1 stored as 25-20';

  -- set 2: b wins 25-23
  FOR i IN 1..23 LOOP m := apply_score_event(m.id, 'a', 1, v_staff); END LOOP;
  FOR i IN 1..25 LOOP m := apply_score_event(m.id, 'b', 1, v_staff); END LOOP;
  m := finish_set(m.id, v_staff);
  ASSERT m.sets_a = 1 AND m.sets_b = 1 AND m.current_set = 3, 'sets 1-1, set 3 open';

  -- set 3: a wins 15-10, decided -> no set 4
  FOR i IN 1..15 LOOP m := apply_score_event(m.id, 'a', 1, v_staff); END LOOP;
  FOR i IN 1..10 LOOP m := apply_score_event(m.id, 'b', 1, v_staff); END LOOP;
  m := finish_set(m.id, v_staff);
  ASSERT m.sets_a = 2 AND m.sets_b = 1, 'sets 2-1';
  ASSERT m.current_set = 3, 'decided: still on set 3';
  ASSERT m.score_a = 15, 'final set score kept visible';
  ASSERT (SELECT count(*) FROM match_sets WHERE match_id = m.id) = 3, 'exactly 3 sets';

  m := finish_match(m.id, v_staff);
  ASSERT m.status = 'finished', 'finished';
  ASSERT m.points_a = 3 AND m.points_b = 0, format('set winner gets 3 pts, got %s/%s', m.points_a, m.points_b);
  ASSERT (SELECT count(*) FROM score_events WHERE match_id = m.id AND event_type = 'score') = 118, 'all score events recorded';

  RAISE NOTICE 'sets sport: OK';
END $$;

-- finish_match auto-closes an open, non-tied set
DO $$
DECLARE
  v_staff jsonb := '{"type":"staff","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000002","label":"Staff"}';
  m matches;
BEGIN
  -- takraw: a genuine set sport (petanque became a single game to 11 in 009)
  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue)
  VALUES ('a3333333-3333-3333-3333-333333333333',
          '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
          '2026-10-09', '18:00', 'สนามตะกร้อ') RETURNING * INTO m;
  m := start_match(m.id, v_staff);
  m := apply_score_event(m.id, 'b', 5, v_staff);
  m := apply_score_event(m.id, 'b', 5, v_staff);
  m := apply_score_event(m.id, 'b', 5, v_staff);   -- 0-15
  m := finish_match(m.id, v_staff);                -- set never explicitly closed
  ASSERT m.sets_b = 1 AND m.sets_a = 0, 'open set auto-closed on finish';
  ASSERT m.points_b = 3, 'winner gets 3';
  RAISE NOTICE 'auto-close set on finish: OK';
END $$;

-- ------------------------------------------------ 3. standings view
\echo '--- team_standings'
SELECT name, total_points, matches_played, wins, draws, losses FROM team_standings;
DO $$
BEGIN
  ASSERT (SELECT wins FROM team_standings WHERE name = 'สีเขียว') = 2, 'green: futsal? no — volley + petanque = 2 wins';
  ASSERT (SELECT total_points FROM team_standings WHERE name = 'สีแดง') = 3, 'red: 1 win (futsal) = 3';
  ASSERT (SELECT losses FROM team_standings WHERE name = 'สีม่วง') = 1, 'purple lost volleyball';
  RAISE NOTICE 'standings: OK';
END $$;

-- ------------------------------------------------ 4. bracket
DO $$
DECLARE
  v_admin jsonb := '{"type":"admin","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000001","label":"Admin"}';
  v_staff jsonb := '{"type":"staff","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000002","label":"Staff"}';
  b jsonb;
  m matches;
  f matches;
  t matches;
BEGIN
  BEGIN
    PERFORM generate_bracket('a4444444-4444-4444-4444-444444444444', '{"seeds":[]}', v_staff);
    RAISE EXCEPTION 'expected ADMIN_ONLY';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  b := generate_bracket('a4444444-4444-4444-4444-444444444444', jsonb_build_object(
    'seeds', jsonb_build_array('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
                               '33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444'),
    'semi_date','2026-10-10','semi_time_1','10:00','semi_time_2','11:00',
    'final_date','2026-10-11','third_time','13:00','final_time','14:00','venue','โรงยิม'), v_admin);

  SELECT * INTO f FROM matches WHERE id = (b->>'final')::uuid;
  ASSERT f.team_a_id IS NULL AND f.team_b_id IS NULL AND f.round = 'final', 'final has no teams yet';

  -- cannot start a match with unknown teams
  BEGIN
    PERFORM start_match(f.id, v_admin);
    RAISE EXCEPTION 'expected MATCH_TEAMS_NOT_SET';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- semi 1: seed1 (red) beats seed4 (purple)
  SELECT * INTO m FROM matches WHERE id = (b->>'semi_1')::uuid;
  m := start_match(m.id, v_admin);
  m := apply_score_event(m.id, 'a', 3, v_admin);
  m := finish_match(m.id, v_admin);

  SELECT * INTO f FROM matches WHERE id = (b->>'final')::uuid;
  SELECT * INTO t FROM matches WHERE id = (b->>'third')::uuid;
  ASSERT f.team_a_id = '11111111-1111-1111-1111-111111111111', 'winner of semi 1 -> final slot a';
  ASSERT t.team_a_id = '44444444-4444-4444-4444-444444444444', 'loser of semi 1 -> third slot a';

  -- semi 2: seed3 (green) beats seed2 (blue)
  SELECT * INTO m FROM matches WHERE id = (b->>'semi_2')::uuid;
  m := start_match(m.id, v_admin);
  m := apply_score_event(m.id, 'b', 2, v_admin);
  m := finish_match(m.id, v_admin);
  SELECT * INTO f FROM matches WHERE id = (b->>'final')::uuid;
  ASSERT f.team_b_id = '33333333-3333-3333-3333-333333333333', 'winner of semi 2 -> final slot b';

  BEGIN
    PERFORM generate_bracket('a4444444-4444-4444-4444-444444444444', '{"seeds":[]}', v_admin);
    RAISE EXCEPTION 'expected BRACKET_ALREADY_EXISTS';
  EXCEPTION WHEN unique_violation THEN NULL; END;

  RAISE NOTICE 'bracket: OK';
END $$;

-- ------------------------------------------------ 5. audit trigger + no direct client write path (003 / 005)
DO $$
DECLARE m matches; n int;
BEGIN
  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue)
  VALUES ('a1111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
          '2026-10-10', '12:00', 'สนาม 2') RETURNING * INTO m;

  -- 003: staff can no longer UPDATE matches directly (policy + guard gone)
  ASSERT NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'staff_update'),
    'staff_update policy must be dropped by 003';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_staff_match_update'),
    'guard trigger must be dropped by 003';

  -- 005: no client-side write policies remain; everything goes through the
  -- service-role API routes. get_user_role() is only used for SELECT now.
  ASSERT NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname IN ('admin_write', 'admin_all')),
    'admin_write / admin_all policies must be dropped by 005';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND cmd <> 'SELECT'),
    'only SELECT policies may exist after 005';
  ASSERT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'admin_read' AND cmd = 'SELECT'),
    'app_settings keeps an admin SELECT policy';

  -- admin writes through RLS are audited with old/new values
  PERFORM set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000001', true);
  ASSERT get_user_role() = 'super_admin', 'stub auth.uid works';
  UPDATE matches SET venue = 'สนาม 3' WHERE id = m.id;
  SELECT count(*) INTO n FROM audit_logs WHERE target_type = 'matches' AND target_id = m.id;
  ASSERT n = 1, format('expected 1 audit row for admin update, got %s', n);
  -- (all rows share now() inside this test transaction, so match by content not order)
  ASSERT EXISTS (SELECT 1 FROM audit_logs WHERE target_type='matches' AND target_id=m.id
                   AND action = 'update_matches'
                   AND old_values->>'venue' = 'สนาม 2' AND new_values->>'venue' = 'สนาม 3'),
    'audit captures old and new values';

  -- service role (no auth.uid) is not audited by the trigger
  PERFORM set_config('request.jwt.claim.sub', '', true);
  UPDATE matches SET venue = 'สนาม 4' WHERE id = m.id;
  SELECT count(*) INTO n FROM audit_logs WHERE target_type = 'matches' AND target_id = m.id;
  ASSERT n = 1, 'service-role write not logged by trigger';

  RAISE NOTICE 'audit trigger + 003: OK';
END $$;

-- ------------------------------------------------ 6. rate limiter
DO $$
DECLARE r jsonb; i int;
BEGIN
  FOR i IN 1..3 LOOP
    r := check_rate_limit('test:ip', 3, 60);
    ASSERT (r->>'allowed')::boolean, format('hit %s should be allowed', i);
  END LOOP;
  r := check_rate_limit('test:ip', 3, 60);
  ASSERT NOT (r->>'allowed')::boolean, '4th hit blocked';
  ASSERT (r->>'remaining')::int = 0, 'remaining 0';

  UPDATE rate_limits SET window_start = now() - interval '61 seconds' WHERE key = 'test:ip';
  r := check_rate_limit('test:ip', 3, 60);
  ASSERT (r->>'allowed')::boolean AND (r->>'remaining')::int = 2, 'window reset';
  RAISE NOTICE 'rate limiter: OK';
END $$;

-- ------------------------------------------------ 7. athletes phone no longer public
DO $$
DECLARE n int;
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'athletes' AND policyname = 'public_read'),
    'athletes.public_read policy must be gone';
  SELECT count(*) INTO n FROM information_schema.columns
  WHERE table_name = 'athletes_public' AND column_name = 'phone';
  ASSERT n = 0, 'athletes_public exposes no phone';
  ASSERT (SELECT count(*) FROM pg_constraint WHERE conname = 'registrations_cancelled_by_fkey') = 1, 'cancelled_by FK added';
  RAISE NOTICE 'security fixes: OK';
END $$;

-- ------------------------------------------------ 8. match meta columns (004)
DO $$
DECLARE
  m matches;
  v_admin jsonb := '{"type":"admin","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000001","label":"Admin One"}';
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns
          WHERE table_name = 'matches' AND column_name IN ('category', 'match_number')) = 2,
    '004 adds matches.category and matches.match_number';
  ASSERT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_matches_sport_number'),
    '004 adds idx_matches_sport_number';

  -- both are optional display fields; the scoring functions must ignore them
  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue, category, match_number)
  VALUES ('a1111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
          '2026-10-11', '09:00', 'สนาม 1', 'หญิง', 7) RETURNING * INTO m;
  m := start_match(m.id, v_admin);
  m := apply_score_event(m.id, 'a', 1, v_admin);
  ASSERT m.category = 'หญิง' AND m.match_number = 7, 'meta columns survive scoring';

  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue)
  VALUES ('a1111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
          '2026-10-11', '10:00', 'สนาม 1') RETURNING * INTO m;
  ASSERT m.category IS NULL AND m.match_number IS NULL, 'meta columns default to NULL';
  RAISE NOTICE 'match meta (004): OK';
END $$;

-- ------------------------------------------------ 9. atomic registration (006)
DO $$
DECLARE
  v_dept   uuid;
  v_sport  uuid := 'a1111111-1111-1111-1111-111111111111';  -- futsal, quota 14/team
  v_other  uuid;
  r        jsonb;
  i        int;
  n        int;
BEGIN
  SELECT id INTO v_dept FROM departments WHERE team_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
  SELECT id INTO v_other FROM sports WHERE id <> v_sport ORDER BY sort_order LIMIT 1;
  ASSERT v_dept IS NOT NULL, 'seed has a department for team 1';

  -- happy path: athlete + 2 registrations in one call
  r := register_athlete('66-0000-00001', 'ทดสอบ หนึ่ง', v_dept, '0810000001', ARRAY[v_sport, v_other]);
  ASSERT (r->>'team_id')::uuid = '11111111-1111-1111-1111-111111111111', 'team derived from department';
  SELECT count(*) INTO n FROM registrations WHERE athlete_id = (r->>'athlete_id')::uuid;
  ASSERT n = 2, format('expected 2 registrations, got %s', n);

  -- duplicate student id → DUPLICATE_REGISTRATION and nothing inserted
  BEGIN
    PERFORM register_athlete('66-0000-00001', 'ซ้ำ', v_dept, '0810000002', ARRAY[v_sport]);
    RAISE EXCEPTION 'expected DUPLICATE_REGISTRATION';
  EXCEPTION WHEN unique_violation THEN
    ASSERT SQLERRM LIKE 'DUPLICATE_REGISTRATION%', SQLERRM;
  END;

  -- bad inputs
  BEGIN
    PERFORM register_athlete('66-0000-00002', 'x', gen_random_uuid(), '0810000002', ARRAY[v_sport]);
    RAISE EXCEPTION 'expected INVALID_DEPARTMENT';
  EXCEPTION WHEN check_violation THEN ASSERT SQLERRM LIKE 'INVALID_DEPARTMENT%', SQLERRM; END;
  BEGIN
    PERFORM register_athlete('66-0000-00002', 'x', v_dept, '0810000002', ARRAY[v_sport, v_sport]);
    RAISE EXCEPTION 'expected INVALID_SPORT_COUNT (duplicate sport)';
  EXCEPTION WHEN check_violation THEN ASSERT SQLERRM LIKE 'INVALID_SPORT_COUNT%', SQLERRM; END;
  BEGIN
    PERFORM register_athlete('66-0000-00002', 'x', v_dept, '0810000002', ARRAY[gen_random_uuid()]);
    RAISE EXCEPTION 'expected INVALID_SPORT';
  EXCEPTION WHEN check_violation THEN ASSERT SQLERRM LIKE 'INVALID_SPORT%', SQLERRM; END;

  -- fill the futsal quota for team 1 (1 already in), then the 15th is refused
  FOR i IN 2..14 LOOP
    PERFORM register_athlete(format('66-0000-%s', lpad(i::text, 5, '0')), format('นักกีฬา %s', i), v_dept,
                             format('08100%s', lpad(i::text, 5, '0')), ARRAY[v_sport]);
  END LOOP;
  SELECT count(*) INTO n FROM registrations r2 JOIN athletes a ON a.id = r2.athlete_id
  WHERE r2.sport_id = v_sport AND a.team_id = '11111111-1111-1111-1111-111111111111' AND r2.status = 'registered';
  ASSERT n = 14, format('quota filled to 14, got %s', n);
  BEGIN
    PERFORM register_athlete('66-0000-00099', 'คนที่ 15', v_dept, '0810000099', ARRAY[v_other, v_sport]);
    RAISE EXCEPTION 'expected QUOTA_FULL';
  EXCEPTION WHEN check_violation THEN ASSERT SQLERRM LIKE 'QUOTA_FULL: ฟุตซอล (14/14)%', SQLERRM; END;
  -- and the refused call left no athlete behind (all-or-nothing)
  ASSERT NOT EXISTS (SELECT 1 FROM athletes WHERE student_id = '66-0000-00099'), 'refused registration inserts nothing';

  -- a cancelled registration frees the slot
  UPDATE registrations SET status = 'cancelled' WHERE athlete_id = (r->>'athlete_id')::uuid AND sport_id = v_sport;
  PERFORM register_athlete('66-0000-00099', 'คนที่ 15', v_dept, '0810000099', ARRAY[v_sport]);

  ASSERT NOT has_function_privilege('anon', 'register_athlete(text, text, uuid, text, uuid[])', 'EXECUTE'),
    'anon cannot call register_athlete';
  RAISE NOTICE 'register_athlete (006): OK';
END $$;

-- ------------------------------------------------ 10. live scores hidden from anon (007 view + 008 lockdown)
DO $$
DECLARE
  m matches;
  v jsonb;
  v_admin jsonb := '{"type":"admin","admin_user_id":"aaaaaaaa-0000-0000-0000-000000000001","label":"Admin One"}';
BEGIN
  INSERT INTO matches (sport_id, team_a_id, team_b_id, match_date, match_time, venue)
  VALUES ('a1111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
          '2026-10-11', '15:00', 'สนามซ่อน') RETURNING * INTO m;
  m := start_match(m.id, v_admin);
  m := apply_score_event(m.id, 'a', 1, v_admin);
  m := apply_score_event(m.id, 'a', 1, v_admin);

  -- while live: the public view hides the score but keeps the schedule info
  SELECT to_jsonb(p) INTO v FROM matches_public p WHERE p.id = m.id;
  ASSERT v->>'status' = 'live', 'public view still reports the live status';
  ASSERT v->'score_a' = 'null'::jsonb AND v->'score_b' = 'null'::jsonb, 'live score is masked';
  ASSERT v->'sets_a' = 'null'::jsonb AND v->'last_scored_team' = 'null'::jsonb, 'sets and last scorer masked';
  ASSERT v->>'venue' = 'สนามซ่อน' AND v->>'match_time' IS NOT NULL, 'schedule fields still public';

  -- after the match: the real score is public
  m := finish_match(m.id, v_admin);
  SELECT to_jsonb(p) INTO v FROM matches_public p WHERE p.id = m.id;
  ASSERT (v->>'score_a')::int = 2 AND (v->>'score_b')::int = 0, 'finished score is published';

  -- anon may read the view, never the tables that carry live numbers
  ASSERT has_table_privilege('anon', 'matches_public', 'SELECT'), 'anon can read matches_public';
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename IN ('matches', 'match_sets', 'score_events') AND policyname = 'public_read'
  ), '008 drops public_read on matches / match_sets / score_events';
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE tablename IN ('matches', 'match_sets', 'score_events') AND policyname = 'staff_read') = 3,
    '008 adds staff_read on all three tables';
  RAISE NOTICE 'hide live scores (007 + 008): OK';
END $$;

-- ------------------------------------------------ 11. official sport rules (009)
DO $$
DECLARE r record;
BEGIN
  SELECT scoring_type, sets_to_win, points_per_set INTO r FROM sports WHERE name = 'เซปักตะกร้อ';
  ASSERT r.scoring_type = 'sets' AND r.sets_to_win = 2 AND r.points_per_set = 15,
    format('ตะกร้อต้องเป็น 2 ใน 3 เซตละ 15 — ได้ %s/%s/%s', r.scoring_type, r.sets_to_win, r.points_per_set);

  SELECT scoring_type, sets_to_win, points_per_set INTO r FROM sports WHERE name = 'เปตอง';
  ASSERT r.scoring_type = 'points' AND r.sets_to_win = 1 AND r.points_per_set = 11,
    format('เปตองต้องเป็นเกมเดียวถึง 11 — ได้ %s/%s/%s', r.scoring_type, r.sets_to_win, r.points_per_set);

  SELECT scoring_type, sets_to_win, points_per_set INTO r FROM sports WHERE name = 'วอลเลย์บอล';
  ASSERT r.scoring_type = 'sets' AND r.sets_to_win = 2 AND r.points_per_set = 25, 'วอลเลย์ 2 ใน 3 เซตละ 25';

  ASSERT (SELECT count(*) FROM sports WHERE scoring_type = 'points') = 3, 'ฟุตซอล บาส เปตอง นับเป็นแต้ม';
  RAISE NOTICE 'official sport rules (009): OK';
END $$;

\echo '--- score_events sample'
SELECT event_type, team, delta, actor_type, actor_label, meta->'to' AS to_score
FROM score_events ORDER BY created_at LIMIT 8;

ROLLBACK;
\echo '=== ALL SCENARIOS PASSED (rolled back) ==='
