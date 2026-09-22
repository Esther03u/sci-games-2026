-- ============================================================================
-- 006_register_athlete.sql — Sci Games 2026
--
-- Atomic public registration. Before this, /api/register validated the
-- per-team sport quota in one query and inserted athlete + registrations in
-- two more, so two students submitting at the same moment could both pass
-- the quota check and both get in (and a crash between the inserts left an
-- orphan athlete). register_athlete() does the quota check and both inserts
-- in one transaction, serialised per (team, sport) with an advisory lock.
--
-- Error codes RAISEd (mapped in src/app/api/register/route.js):
--   DUPLICATE_REGISTRATION, INVALID_DEPARTMENT, INVALID_SPORT,
--   INVALID_SPORT_COUNT, QUOTA_FULL
-- Additive, idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION register_athlete(
  p_student_id    text,
  p_full_name     text,
  p_department_id uuid,
  p_phone         text,
  p_sport_ids     uuid[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id   uuid;
  v_athlete   athletes;
  v_sport     record;
  v_count     integer;
  v_sport_ids uuid[];
BEGIN
  IF p_sport_ids IS NULL OR cardinality(p_sport_ids) < 1 OR cardinality(p_sport_ids) > 2 THEN
    RAISE EXCEPTION 'INVALID_SPORT_COUNT' USING ERRCODE = 'check_violation';
  END IF;
  SELECT array_agg(DISTINCT s ORDER BY s) INTO v_sport_ids FROM unnest(p_sport_ids) AS s;
  IF cardinality(v_sport_ids) <> cardinality(p_sport_ids) THEN
    RAISE EXCEPTION 'INVALID_SPORT_COUNT' USING ERRCODE = 'check_violation';
  END IF;

  SELECT team_id INTO v_team_id FROM departments WHERE id = p_department_id;
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_DEPARTMENT' USING ERRCODE = 'check_violation';
  END IF;

  IF (SELECT count(*) FROM sports WHERE id = ANY(v_sport_ids)) <> cardinality(v_sport_ids) THEN
    RAISE EXCEPTION 'INVALID_SPORT' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM athletes WHERE student_id = p_student_id) THEN
    RAISE EXCEPTION 'DUPLICATE_REGISTRATION' USING ERRCODE = 'unique_violation';
  END IF;

  -- Serialise concurrent registrations for the same (team, sport) so the
  -- quota count below cannot be overtaken. Sorted ids → no lock-order deadlock.
  FOR v_sport IN
    SELECT s.id, s.name, s.max_players_per_team
    FROM sports s WHERE s.id = ANY(v_sport_ids) ORDER BY s.id
  LOOP
    IF v_sport.max_players_per_team IS NOT NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('quota:' || v_team_id::text || ':' || v_sport.id::text));
      SELECT count(*) INTO v_count
      FROM registrations r JOIN athletes a ON a.id = r.athlete_id
      WHERE r.sport_id = v_sport.id AND r.status = 'registered' AND a.team_id = v_team_id;
      IF v_count >= v_sport.max_players_per_team THEN
        RAISE EXCEPTION 'QUOTA_FULL: % (%/%)', v_sport.name, v_count, v_sport.max_players_per_team
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END LOOP;

  INSERT INTO athletes (student_id, full_name, department_id, team_id, phone)
  VALUES (p_student_id, p_full_name, p_department_id, v_team_id, p_phone)
  RETURNING * INTO v_athlete;

  INSERT INTO registrations (athlete_id, sport_id, status)
  SELECT v_athlete.id, s, 'registered' FROM unnest(v_sport_ids) AS s;

  RETURN jsonb_build_object(
    'athlete_id', v_athlete.id,
    'student_id', v_athlete.student_id,
    'full_name',  v_athlete.full_name,
    'team_id',    v_team_id
  );
EXCEPTION
  WHEN unique_violation THEN
    -- athletes.student_id race between the EXISTS check and the INSERT
    RAISE EXCEPTION 'DUPLICATE_REGISTRATION' USING ERRCODE = 'unique_violation';
END $$;

-- Service role only (the API route calls it); never from the browser.
REVOKE EXECUTE ON FUNCTION register_athlete(text, text, uuid, text, uuid[]) FROM PUBLIC, anon, authenticated;
