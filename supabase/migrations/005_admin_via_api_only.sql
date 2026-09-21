-- ============================================================================
-- 005_admin_via_api_only.sql — Sci Games 2026
--
-- Refactor P2-11 moved every admin dashboard write (matches, announcements,
-- departments, sport_schedules, athletes, registrations) to
-- /api/admin/[resource], which runs with the service role and writes an
-- audit_logs row. PINs, users, settings and brackets were already API-only.
--
-- The anon/authenticated clients therefore no longer need any INSERT /
-- UPDATE / DELETE access: the broad "admin_write" FOR ALL policies from 001
-- (and "admin_all" on app_settings from 002) are replaced by SELECT-only
-- policies so an admin session can still read what the dashboards list.
-- Public tables keep their existing "public_read" policies.
--
-- Idempotent; safe to re-run.
-- ============================================================================

-- Public tables: public_read (001) already covers SELECT; just drop writes.
DROP POLICY IF EXISTS "admin_write" ON teams;
DROP POLICY IF EXISTS "admin_write" ON departments;
DROP POLICY IF EXISTS "admin_write" ON sports;
DROP POLICY IF EXISTS "admin_write" ON sport_schedules;
DROP POLICY IF EXISTS "admin_write" ON announcements;
DROP POLICY IF EXISTS "admin_write" ON athletes;
DROP POLICY IF EXISTS "admin_write" ON registrations;
DROP POLICY IF EXISTS "admin_write" ON matches;

-- Admin-only tables: self_read / admin_read_all (admin_users) and auth_read
-- (staff_sport_assignments) from 001 keep the dashboards readable.
DROP POLICY IF EXISTS "admin_write" ON admin_users;
DROP POLICY IF EXISTS "admin_write" ON staff_sport_assignments;

-- app_settings is read server-side with the service role; an admin session
-- may still SELECT it, but never write.
DROP POLICY IF EXISTS "admin_all" ON app_settings;
DROP POLICY IF EXISTS "admin_read" ON app_settings;
CREATE POLICY "admin_read" ON app_settings FOR SELECT USING (get_user_role() = 'super_admin');
