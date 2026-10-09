// Copy the live data (teams, sports, matches, scores, PINs, settings…) from
// the Supabase project in .env.local into the LOCAL Supabase stack, so the
// app can be tested without touching production.
//   npx supabase start                      # local stack (Docker) — once
//   node scripts/clone-prod-to-local.mjs    # re-run any time to refresh
//
// Production is only read (service-role SELECTs). The local database is
// written over psql with session_replication_role = replica, so triggers
// (audit log, bracket advance, points) don't fire and foreign keys aren't
// checked while rows load in any order.
//
// Not copied: admin_users / staff_sport_assignments / audit_logs (they point
// at production auth users — create a local admin with create-admin.mjs),
// page_views, rate_limits. Columns pointing at admin_users are nulled.
//
// Env: LOCAL_DB_URL (default postgresql://postgres:postgres@127.0.0.1:54322/postgres)
//      PSQL         (default: psql on PATH, else PostgreSQL 17/16 under Program Files)
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adminClient, loadEnv, projectRef } from './lib/env.mjs';

const LOCAL_DB_URL = process.env.LOCAL_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// table → columns to blank (they reference rows that aren't copied)
const TABLES = {
  teams: [],
  departments: [],
  sports: [],
  sport_schedules: [],
  athletes: [],
  registrations: ['cancelled_by'],
  matches: ['updated_by'],
  match_sets: [],
  sport_pins: ['created_by', 'active_session_id'],
  score_events: ['actor_admin_user_id'],
  announcements: ['created_by'],
  app_settings: [],
};

function assertLocal(url) {
  const host = new URL(url).hostname;
  if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host)) {
    throw new Error(`refusing to write to ${host} — LOCAL_DB_URL must point at this machine`);
  }
}

function findPsql() {
  if (process.env.PSQL) return process.env.PSQL;
  if (spawnSync('psql', ['--version']).status === 0) return 'psql';
  for (const v of [17, 16, 15]) {
    const p = `C:\\Program Files\\PostgreSQL\\${v}\\bin\\psql.exe`;
    if (existsSync(p)) return p;
  }
  throw new Error('psql not found — install PostgreSQL client tools or set PSQL=<path to psql>');
}

async function fetchAll(db, table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from(table)
      .select('*')
      .range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

/** dollar-quote tag that can't appear inside the payload */
function quoteTag(text) {
  let tag = 'j';
  while (text.includes(`$${tag}$`)) tag += 'j';
  return `$${tag}$`;
}

assertLocal(LOCAL_DB_URL);
const psql = findPsql();
const env = loadEnv();
const prod = adminClient(env);
console.log(`source: production project ${projectRef(env)} (read-only)`);
console.log(`target: ${LOCAL_DB_URL.replace(/:[^:@/]+@/, ':***@')}`);

const sql = [
  'BEGIN;',
  'SET LOCAL session_replication_role = replica;',
  `TRUNCATE ${[...Object.keys(TABLES), 'audit_logs', 'page_views', 'rate_limits'].join(', ')} CASCADE;`,
];
for (const [table, blank] of Object.entries(TABLES)) {
  const rows = (await fetchAll(prod, table)).map((r) => {
    const copy = { ...r };
    for (const col of blank) if (col in copy) copy[col] = null;
    return copy;
  });
  console.log(`  ${table.padEnd(16)} ${rows.length} rows`);
  if (rows.length === 0) continue;
  const json = JSON.stringify(rows);
  const q = quoteTag(json);
  sql.push(
    `INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table}, ${q}${json}${q}::jsonb);`
  );
}
sql.push('COMMIT;', "NOTIFY pgrst, 'reload schema';");

const dir = mkdtempSync(join(tmpdir(), 'sg-clone-'));
const file = join(dir, 'clone.sql');
try {
  writeFileSync(file, sql.join('\n'));
  const res = spawnSync(psql, ['-v', 'ON_ERROR_STOP=1', '-q', '-d', LOCAL_DB_URL, '-f', file], {
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    console.error(res.stderr || res.error);
    process.exit(1);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log('done — local database now mirrors production data');
