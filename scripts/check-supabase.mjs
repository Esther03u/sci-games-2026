// Probe the Supabase project named in .env.local: which migrations are applied,
// is seed data present, is the athletes phone leak closed. Read-only.
//   node scripts/check-supabase.mjs
import { loadEnv, adminClient, anonClient, projectRef } from './lib/env.mjs';

const env = loadEnv();
const admin = adminClient(env);
const anon = anonClient(env);

console.log('project:', projectRef(env));
console.log('PIN_SESSION_SECRET:', env.PIN_SESSION_SECRET?.length >= 16 ? 'set' : 'MISSING');

const probe = async (client, table) => {
  const { data, error, status } = await client.from(table).select('*').limit(1);
  if (error) return `ERROR ${status} ${error.code}: ${error.message}`;
  return `${data.length ? 'has rows' : 'empty'} (cols: ${data[0] ? Object.keys(data[0]).length : '?'})`;
};

console.log('\n[001 tables]');
for (const t of ['teams', 'sports', 'departments', 'matches', 'admin_users', 'athletes']) {
  console.log(`  ${t.padEnd(14)} ${await probe(admin, t)}`);
}
console.log('[002 tables]');
for (const t of ['match_sets', 'score_events', 'sport_pins', 'app_settings', 'rate_limits']) {
  console.log(`  ${t.padEnd(14)} ${await probe(admin, t)}`);
}
console.log('[002 columns/functions]');
{
  const { data, error } = await admin
    .from('sports')
    .select('name, scoring_type, sets_to_win')
    .order('sort_order');
  console.log(
    '  sports.scoring_type:',
    error
      ? `ERROR ${error.code}: ${error.message}`
      : data.map((s) => `${s.name}=${s.scoring_type}`).join(', ') || 'no sports rows'
  );
}
{
  const { error } = await admin.rpc('check_rate_limit', {
    p_key: 'healthcheck',
    p_limit: 1000,
    p_window_seconds: 60,
  });
  console.log('  check_rate_limit():', error ? `ERROR ${error.code}: ${error.message}` : 'OK');
}
{
  const { data, error } = await admin.from('app_settings').select('key, value');
  console.log('  app_settings:', error ? `ERROR ${error.code}` : JSON.stringify(data));
}
console.log('[security]');
{
  const { data, error, status } = await anon.from('athletes').select('phone').limit(1);
  console.log(
    '  athletes.phone via anon:',
    error
      ? `blocked ${status} ${error.code}`
      : data.length
        ? 'READABLE — phone leak, 002 not applied'
        : 'no error but empty (policy still open if rows exist)'
  );
}
{
  const { data, error } = await anon.from('athletes_public').select('id').limit(1);
  console.log('  athletes_public via anon:', error ? `ERROR ${error.code}: ${error.message}` : 'OK');
}
console.log('[007 views]');
{
  const { data, error } = await anon.from('matches_public_v2').select('id').limit(1);
  console.log('  matches_public_v2 via anon:', error ? `NOT APPLIED (${error.message})` : 'OK');
}
{
  const { data } = await admin.from('admin_users').select('display_name, role');
  console.log(
    '  admin_users:',
    data?.length ? data.map((a) => `${a.display_name}(${a.role})`).join(', ') : 'none'
  );
}
