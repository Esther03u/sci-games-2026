-- ===== ENUMS =====
DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'finished', 'postponed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('registered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ===== TABLES =====

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color_hex text NOT NULL,
  logo_emoji text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sport_type text NOT NULL CHECK (sport_type IN ('individual', 'team')),
  max_players_per_team integer,
  win_points integer DEFAULT 3,
  draw_points integer DEFAULT 1,
  lose_points integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sport_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
  status registration_status DEFAULT 'registered',
  created_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  cancelled_by uuid,
  UNIQUE(athlete_id, sport_id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_sport_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  UNIQUE(admin_user_id, sport_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
  team_a_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  team_b_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  match_date date NOT NULL,
  match_time time NOT NULL,
  venue text NOT NULL,
  status match_status DEFAULT 'upcoming',
  score_a integer,
  score_b integer,
  points_a integer DEFAULT 0,
  points_b integer DEFAULT 0,
  updated_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (team_a_id != team_b_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_by uuid REFERENCES admin_users(id),
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  device_type text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_athletes_student_id ON athletes(student_id);
CREATE INDEX IF NOT EXISTS idx_athletes_team_id ON athletes(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_athlete_id ON registrations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_registrations_sport_id ON registrations(sport_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_matches_sport_id ON matches(sport_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_sport_schedules_sport_id ON sport_schedules(sport_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_hash ON page_views(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ===== VIEW: team_standings =====
CREATE OR REPLACE VIEW team_standings AS
SELECT
  t.id,
  t.name,
  t.color_hex,
  t.logo_emoji,
  t.sort_order,
  COALESCE(SUM(
    CASE
      WHEN m.team_a_id = t.id THEN m.points_a
      WHEN m.team_b_id = t.id THEN m.points_b
      ELSE 0
    END
  ), 0)::integer AS total_points,
  COUNT(CASE WHEN m.status = 'finished' THEN 1 END)::integer AS matches_played,
  COUNT(CASE WHEN m.status = 'finished'
    AND ((m.team_a_id = t.id AND m.score_a > m.score_b)
      OR (m.team_b_id = t.id AND m.score_b > m.score_a))
    THEN 1 END)::integer AS wins,
  COUNT(CASE WHEN m.status = 'finished'
    AND m.score_a = m.score_b THEN 1 END)::integer AS draws,
  COUNT(CASE WHEN m.status = 'finished'
    AND ((m.team_a_id = t.id AND m.score_a < m.score_b)
      OR (m.team_b_id = t.id AND m.score_b < m.score_a))
    THEN 1 END)::integer AS losses
FROM teams t
LEFT JOIN matches m ON (m.team_a_id = t.id OR m.team_b_id = t.id)
  AND m.status = 'finished'
GROUP BY t.id, t.name, t.color_hex, t.logo_emoji, t.sort_order
ORDER BY total_points DESC, wins DESC;

-- ===== VIEW: athletes_public (no phone exposed) =====
CREATE OR REPLACE VIEW athletes_public AS
SELECT id, student_id, full_name, department_id, team_id, created_at
FROM athletes;

-- ===== TRIGGER: auto-calculate match points =====
CREATE OR REPLACE FUNCTION calculate_match_points()
RETURNS TRIGGER AS $$
DECLARE
  sport_record RECORD;
BEGIN
  IF NEW.status = 'finished' AND NEW.score_a IS NOT NULL AND NEW.score_b IS NOT NULL THEN
    SELECT win_points, draw_points, lose_points INTO sport_record
    FROM sports WHERE id = NEW.sport_id;

    IF NEW.score_a > NEW.score_b THEN
      NEW.points_a := COALESCE(sport_record.win_points, 3);
      NEW.points_b := COALESCE(sport_record.lose_points, 0);
    ELSIF NEW.score_a < NEW.score_b THEN
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

DROP TRIGGER IF EXISTS trg_match_points ON matches;
CREATE TRIGGER trg_match_points
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_match_points();

-- ===== TRIGGER: auto-set updated_at =====
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== RLS POLICIES =====
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's admin role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM admin_users WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if staff assigned to sport
CREATE OR REPLACE FUNCTION is_staff_for_sport(sport uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_sport_assignments ssa
    JOIN admin_users au ON au.id = ssa.admin_user_id
    WHERE au.auth_user_id = auth.uid() AND ssa.sport_id = sport
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Public read for: teams, departments, sports, sport_schedules, matches, announcements
DROP POLICY IF EXISTS "public_read" ON teams;
CREATE POLICY "public_read" ON teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON departments;
CREATE POLICY "public_read" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON sports;
CREATE POLICY "public_read" ON sports FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON sport_schedules;
CREATE POLICY "public_read" ON sport_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON matches;
CREATE POLICY "public_read" ON matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON announcements;
CREATE POLICY "public_read" ON announcements FOR SELECT USING (true);

-- Athletes & Registrations: public read
DROP POLICY IF EXISTS "public_read" ON athletes;
CREATE POLICY "public_read" ON athletes FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read" ON registrations;
CREATE POLICY "public_read" ON registrations FOR SELECT USING (true);

-- Admin-only write for configuration & master tables
DROP POLICY IF EXISTS "admin_write" ON teams;
CREATE POLICY "admin_write" ON teams FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON departments;
CREATE POLICY "admin_write" ON departments FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON sports;
CREATE POLICY "admin_write" ON sports FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON sport_schedules;
CREATE POLICY "admin_write" ON sport_schedules FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON announcements;
CREATE POLICY "admin_write" ON announcements FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON admin_users;
CREATE POLICY "admin_write" ON admin_users FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON staff_sport_assignments;
CREATE POLICY "admin_write" ON staff_sport_assignments FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON athletes;
CREATE POLICY "admin_write" ON athletes FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_write" ON registrations;
CREATE POLICY "admin_write" ON registrations FOR ALL USING (get_user_role() = 'super_admin');

-- Matches: admin full access + staff update only for assigned sports
DROP POLICY IF EXISTS "admin_write" ON matches;
CREATE POLICY "admin_write" ON matches FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "staff_update" ON matches;
CREATE POLICY "staff_update" ON matches FOR UPDATE
  USING (get_user_role() = 'staff' AND is_staff_for_sport(sport_id));

-- Admin users: self-read for authenticated, full read for super_admin
DROP POLICY IF EXISTS "self_read" ON admin_users;
CREATE POLICY "self_read" ON admin_users FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "admin_read_all" ON admin_users;
CREATE POLICY "admin_read_all" ON admin_users FOR SELECT
  USING (get_user_role() = 'super_admin');

-- Staff assignments: authenticated read
DROP POLICY IF EXISTS "auth_read" ON staff_sport_assignments;
CREATE POLICY "auth_read" ON staff_sport_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Page views: insert via service role (API), read by admin
DROP POLICY IF EXISTS "admin_read" ON page_views;
CREATE POLICY "admin_read" ON page_views FOR SELECT
  USING (get_user_role() = 'super_admin');

-- Audit logs: insert via service role (API), read by admin
DROP POLICY IF EXISTS "admin_read" ON audit_logs;
CREATE POLICY "admin_read" ON audit_logs FOR SELECT
  USING (get_user_role() = 'super_admin');

-- ===== ENABLE REALTIME =====
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE matches;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
