-- Minimal stand-ins for the parts of a Supabase project that the migrations
-- rely on, so they can be run against a plain local PostgreSQL for testing.
-- NEVER run this on a real Supabase project.

CREATE SCHEMA IF NOT EXISTS auth;

-- auth.uid() reads request.jwt.claim.sub like Supabase does; tests set it with
--   SELECT set_config('request.jwt.claim.sub', '<uuid>', true);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

DO $$ BEGIN CREATE ROLE anon NOLOGIN;          EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN;  EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE PUBLICATION supabase_realtime;
EXCEPTION WHEN duplicate_object THEN null; END $$;
