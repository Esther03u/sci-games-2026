#!/usr/bin/env bash
# Run all migrations + seed + scenario test against a scratch database on a
# local PostgreSQL (NOT Supabase). Requires PGPASSWORD (or a pgpass entry).
#
#   PGPASSWORD=... bash supabase/tests/run-local.sh
#
# Optional env: PGHOST (localhost), PGPORT (5432), PGUSER (postgres), PSQL (psql path)
set -euo pipefail

cd "$(dirname "$0")/../.."

PSQL="${PSQL:-psql}"
if ! command -v "$PSQL" >/dev/null 2>&1 && [ -x "/c/Program Files/PostgreSQL/16/bin/psql.exe" ]; then
  PSQL="/c/Program Files/PostgreSQL/16/bin/psql.exe"
fi
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}"
export PGCLIENTENCODING=UTF8
DB="sci_games_test"

run() { "$PSQL" -v ON_ERROR_STOP=1 -X -q "$@"; }

echo ">> recreate $DB"
run -d postgres -c "DROP DATABASE IF EXISTS $DB WITH (FORCE);"
run -d postgres -c "CREATE DATABASE $DB ENCODING 'UTF8' TEMPLATE template0;"

echo ">> stubs"
run -d "$DB" -f supabase/tests/00_supabase_stubs.sql

for f in supabase/migrations/*.sql; do
  echo ">> $f"
  run -d "$DB" -f "$f"
done

echo ">> seed"
run -d "$DB" -f supabase/seed.sql

echo ">> idempotency: re-run 002"
run -d "$DB" -f supabase/migrations/002_live_scoring.sql

echo ">> scenario"
run -d "$DB" -f supabase/tests/scenario_live_scoring.sql
