// Every API route (and the guarded pages) × every role: anon, PIN referee,
// staff account, super_admin. Complements smoke-test.mjs, which walks the
// scoring flows; this one only asks "who gets in where".
//
//   node scripts/permission-matrix.mjs [https://sci-games-2026.vercel.app]
//
// Creates a throwaway super_admin, a staff account and a PIN (both assigned
// to futsal) and two test matches, then deletes all of it — also on failure.
import { loadEnv, adminClient, anonClient, projectRef } from './lib/env.mjs';

const BASE = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3000';
const env = loadEnv();
const REF = projectRef(env);
const admin = adminClient(env);
// never signed in — each account signs in on its own client below
const anon = anonClient(env);

const TAG = `perm-${Date.now()}`;
const created = { authUserIds: [], adminUserIds: [], pinId: null, matchIds: [] };
let failures = 0;
let checks = 0;

const check = (name, cond, extra = '') => {
  checks += 1;
  console.log(`  ${cond ? '✓' : '✗'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures += 1;
};

// @supabase/ssr cookie encoding (same as smoke-test.mjs)
function sessionCookies(session) {
  const key = `sb-${REF}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
  const encoded = encodeURIComponent(value);
  if (encoded.length <= 3180) return `${key}=${encoded}`;
  const parts = [];
  for (let i = 0, rest = value; rest.length; i += 1) {
    parts.push(`${key}.${i}=${encodeURIComponent(rest.slice(0, 3000))}`);
    rest = rest.slice(3000);
  }
  return parts.join('; ');
}

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const json = await res.json().catch(() => ({}));
  return {
    status: res.status,
    json,
    location: res.headers.get('location') || '',
    cacheControl: res.headers.get('cache-control') || '',
    setCookie: res.headers.get('set-cookie') || '',
  };
}

async function account(role, sportId) {
  const email = `${TAG}-${role}@example.invalid`;
  const password = `Perm-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const { data: au, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  created.authUserIds.push(au.user.id);
  const { data: row, error: rowErr } = await admin
    .from('admin_users')
    .insert({ auth_user_id: au.user.id, display_name: `${TAG} ${role}`, role })
    .select()
    .single();
  if (rowErr) throw rowErr;
  created.adminUserIds.push(row.id);
  if (sportId)
    await admin.from('staff_sport_assignments').insert({ admin_user_id: row.id, sport_id: sportId });
  const { data: signIn, error: siErr } = await anonClient(env).auth.signInWithPassword({ email, password });
  if (siErr) throw siErr;
  return sessionCookies(signIn.session);
}

async function cleanup() {
  console.log('\n[cleanup]');
  if (created.matchIds.length) await admin.from('matches').delete().in('id', created.matchIds);
  if (created.pinId) await admin.from('sport_pins').delete().eq('id', created.pinId);
  for (const id of created.adminUserIds) {
    await admin.from('audit_logs').delete().eq('admin_user_id', id);
    await admin.from('staff_sport_assignments').delete().eq('admin_user_id', id);
    await admin.from('admin_users').delete().eq('id', id);
  }
  for (const id of created.authUserIds) await admin.auth.admin.deleteUser(id);
  await admin.from('rate_limits').delete().like('key', 'pin-login:%');
  console.log('  removed temp accounts, PIN, matches, events');
}

try {
  console.log(`permission matrix → ${BASE} (project ${REF})`);
  const { data: teams } = await admin.from('teams').select('id').order('sort_order');
  const { data: sports } = await admin.from('sports').select('id, name');
  const futsal = sports.find((s) => s.name === 'ฟุตซอล');
  const volley = sports.find((s) => s.name === 'วอลเลย์บอล');

  const adminCookie = await account('super_admin');
  const staffCookie = await account('staff', futsal.id);

  let r = await call('POST', '/api/admin/pins', {
    cookie: adminCookie,
    body: { sport_id: futsal.id, label: `${TAG} referee` },
  });
  created.pinId = r.json.data?.id;
  const createdPin = r.json.data?.pin;
  r = await call('POST', '/api/pin/login', { body: { sport_id: futsal.id, pin: createdPin } });
  const pinCookie = r.setCookie.split(';')[0];
  if (!pinCookie.startsWith('sg_pin=')) throw new Error('could not get a PIN session');

  const mk = async (sport) => {
    const { data } = await admin
      .from('matches')
      .insert({
        sport_id: sport.id,
        team_a_id: teams[0].id,
        team_b_id: teams[1].id,
        match_date: '2026-10-11',
        match_time: '23:00',
        venue: TAG,
      })
      .select()
      .single();
    created.matchIds.push(data.id);
    return data;
  };
  const fm = await mk(futsal);
  const vm = await mk(volley);

  const roles = { anon: undefined, pin: pinCookie, staff: staffCookie, admin: adminCookie };
  const matrix = async (label, method, path, expected, body) => {
    const got = {};
    for (const [role, cookie] of Object.entries(roles)) {
      got[role] = (
        await call(method, path, { cookie, body: typeof body === 'function' ? body() : body })
      ).status;
    }
    const ok = Object.entries(expected).every(([role, want]) =>
      Array.isArray(want) ? want.includes(got[role]) : got[role] === want
    );
    check(`${label}`, ok, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(expected)}`);
  };

  // ------------------------------------------------------------ admin APIs
  console.log('\n[admin APIs: anon/PIN 401 · staff 403 · admin ok]');
  const adminOnly = (ok) => ({ anon: 401, pin: 401, staff: 403, admin: ok });
  await matrix('GET  /api/admin/pins', 'GET', '/api/admin/pins', adminOnly(200));
  await matrix('POST /api/admin/pins (invalid body)', 'POST', '/api/admin/pins', adminOnly(400), {});
  await matrix(
    'POST /api/admin/pins/[id]/reveal (invalid)',
    'POST',
    '/api/admin/pins/invalid-id/reveal',
    adminOnly(400)
  );
  await matrix('GET  /api/admin/settings', 'GET', '/api/admin/settings', adminOnly(200));
  await matrix('PATCH /api/admin/settings (invalid)', 'PATCH', '/api/admin/settings', adminOnly(400), {});
  await matrix('POST /api/admin/matches (invalid)', 'POST', '/api/admin/matches', adminOnly(400), {});
  await matrix('PATCH /api/admin/matches (invalid)', 'PATCH', '/api/admin/matches', adminOnly(400), {});
  await matrix('DELETE /api/admin/matches (no id)', 'DELETE', '/api/admin/matches', adminOnly(400));
  await matrix(
    'POST /api/admin/announcements (invalid)',
    'POST',
    '/api/admin/announcements',
    adminOnly(400),
    {}
  );
  await matrix('POST /api/admin/bracket (invalid)', 'POST', '/api/admin/bracket', adminOnly(400), {});
  await matrix('POST /api/admin/users (invalid)', 'POST', '/api/admin/users', adminOnly(400), {});
  await matrix('DELETE /api/admin/users (no id)', 'DELETE', '/api/admin/users', adminOnly([400, 404]));

  // ------------------------------------------------------------ PIN reveal (migration 012)
  console.log('\n[PIN reveal: admins only, audited, never in the list]');
  await matrix(
    'POST /api/admin/pins/[id]/reveal',
    'POST',
    `/api/admin/pins/${created.pinId}/reveal`,
    adminOnly(200)
  );
  r = await call('POST', `/api/admin/pins/${created.pinId}/reveal`, { cookie: adminCookie });
  check('reveal returns the PIN shown at creation', r.json.data?.pin === createdPin, r.json.message || '');
  check('reveal response is Cache-Control: no-store', r.cacheControl.includes('no-store'), r.cacheControl);
  r = await call('GET', '/api/admin/pins', { cookie: adminCookie });
  const listed = (r.json.data || []).find((p) => p.id === created.pinId);
  check(
    'GET /api/admin/pins: can_reveal, no pin_hash / pin_encrypted',
    listed?.can_reveal === true && !JSON.stringify(r.json).match(/pin_hash|pin_encrypted/),
    JSON.stringify(listed)
  );
  {
    const { count } = await admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'reveal_pin')
      .eq('target_id', created.pinId);
    check('every reveal is in audit_logs (reveal_pin)', count >= 2, `${count} rows`);
  }

  // ------------------------------------------------------------ scoring APIs
  console.log('\n[scoring: futsal PIN/staff may score futsal only]');
  await matrix('POST /api/match/[futsal]/start', 'POST', `/api/match/${fm.id}/start`, {
    anon: 401,
    pin: 200,
    staff: [200, 409],
    admin: [200, 409],
  });
  await matrix(
    'POST /api/score futsal +1',
    'POST',
    '/api/score',
    { anon: 401, pin: 200, staff: 200, admin: 200 },
    {
      match_id: fm.id,
      team: 'a',
      delta: 1,
    }
  );
  await matrix(
    'POST /api/score/undo futsal',
    'POST',
    '/api/score/undo',
    { anon: 401, pin: 200, staff: 200, admin: 200 },
    {
      match_id: fm.id,
    }
  );
  await matrix('POST /api/match/[volley]/start (other sport)', 'POST', `/api/match/${vm.id}/start`, {
    anon: 401,
    pin: 403,
    staff: 403,
    admin: 200,
  });
  await matrix(
    'POST /api/score volley (other sport)',
    'POST',
    '/api/score',
    { anon: 401, pin: 403, staff: 403, admin: 200 },
    {
      match_id: vm.id,
      team: 'a',
      delta: 1,
    }
  );
  await matrix(
    'POST /api/match/[futsal]/override (admin only)',
    'POST',
    `/api/match/${fm.id}/override`,
    {
      anon: 401,
      pin: 403,
      staff: 403,
      admin: 200,
    },
    { score_a: 3, score_b: 1 }
  );

  // ------------------------------------------------------------ live score masking
  console.log('\n[live score masking: futsal match is live at 3-1]');
  for (const [role, cookie] of Object.entries(roles)) {
    r = await call('GET', `/api/match/${fm.id}`, { cookie });
    const masked = r.json.data?.score_a === null;
    check(
      `GET /api/match/[live] as ${role}: ${role === 'anon' ? 'score hidden' : 'score visible'}`,
      r.status === 200 && masked === (role === 'anon'),
      `score_a=${r.json.data?.score_a}`
    );
  }
  // the route is ISR-cached for 30 s (a query string does not bypass it), so
  // wait for a regeneration that includes the new match
  let inSummary;
  for (let i = 0; i < 12 && !inSummary; i += 1) {
    r = await call('GET', '/api/live-summary');
    inSummary = r.json.data?.matches?.find((m) => m.id === fm.id);
    if (!inSummary) await new Promise((res) => setTimeout(res, 5000));
  }
  check(
    'GET /api/live-summary: live match without score',
    inSummary && inSummary.score_a === null,
    JSON.stringify(inSummary?.score_a)
  );
  for (const table of ['matches', 'match_sets', 'score_events']) {
    const { data } = await anon.from(table).select('*').limit(5);
    check(`anon key cannot read ${table}`, (data || []).length === 0, `${(data || []).length} rows`);
  }
  const { data: pub } = await anon
    .from('matches_public_v2')
    .select('score_a, status')
    .eq('id', fm.id)
    .single();
  check('anon key: matches_public_v2 hides the live score', pub?.status === 'live' && pub?.score_a === null);

  // ------------------------------------------------------------ overall standings (placements)
  console.log('\n[overall standings hidden until the podium is opened]');
  {
    const { data: podium } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'podium_countdown')
      .maybeSingle();
    const v = podium?.value || {};
    const open = v.revealed === true || v.status === 'revealed' || v.status === 'fast_forward';
    r = await call('GET', '/api/standings');
    const text = JSON.stringify(r.json);
    check(
      open
        ? 'GET /api/standings: podium open → totals returned'
        : 'GET /api/standings: podium closed → no totals/points',
      r.status === 200 &&
        r.json.data?.revealed === open &&
        (open || !/total_points|golds|"points"/.test(text)),
      open ? '' : text.slice(0, 120)
    );
    const home = await (await fetch(BASE + '/')).text();
    check('home HTML carries no placement totals while closed', open || !/"golds"/.test(home));
  }

  // ------------------------------------------------------------ public APIs
  console.log('\n[public APIs]');
  await matrix('GET  /api/auth/me', 'GET', '/api/auth/me', { anon: 200, pin: 200, staff: 200, admin: 200 });
  const me = {};
  for (const [role, cookie] of Object.entries(roles))
    me[role] = (await call('GET', '/api/auth/me', { cookie })).json.data?.type ?? null;
  check(
    '/api/auth/me types',
    me.anon === null && me.pin === 'pin' && me.staff === 'staff' && me.admin === 'admin',
    JSON.stringify(me)
  );
  await matrix(
    'POST /api/register → 410 for everyone',
    'POST',
    '/api/register',
    { anon: 410, pin: 410, staff: 410, admin: 410 },
    {}
  );
  await matrix(
    'POST /api/check-status (invalid)',
    'POST',
    '/api/check-status',
    { anon: 400, pin: 400, staff: 400, admin: 400 },
    {}
  );
  await matrix(
    'POST /api/track (invalid)',
    'POST',
    '/api/track',
    { anon: 400, pin: 400, staff: 400, admin: 400 },
    {}
  );
  await matrix('GET  /api/live-summary', 'GET', '/api/live-summary', {
    anon: 200,
    pin: 200,
    staff: 200,
    admin: 200,
  });

  // ------------------------------------------------------------ guarded pages
  console.log('\n[pages]');
  const page = async (path, want) => {
    const got = {};
    for (const [role, cookie] of Object.entries(roles)) {
      const res = await fetch(BASE + path, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual' });
      const loc = res.headers.get('location') || '';
      got[role] = res.status >= 300 && res.status < 400 ? `→${new URL(loc, BASE).pathname}` : res.status;
    }
    const ok = Object.entries(want).every(([role, w]) => got[role] === w);
    check(`page ${path}`, ok, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  };
  // staff passes the proxy (it only checks for a session); the admin layout then
  // sends them to /staff/scoring client-side, and RLS limits what the server
  // render could read to what staff may read anyway (checked 24 ก.ย.).
  await page('/admin', { anon: '→/admin/login', pin: '→/admin/login', staff: 200, admin: 200 });
  await page('/admin/matches', { anon: '→/admin/login', pin: '→/admin/login', staff: 200, admin: 200 });
  await page('/staff/scoring', { anon: '→/staff/login', pin: 200, staff: 200, admin: 200 });
  await page('/live', { anon: '→/staff/login', pin: 200, staff: 200, admin: 200 });
} catch (err) {
  failures += 1;
  console.error('\nERROR', err);
} finally {
  await cleanup();
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.log(`=== ${failures} FAILED ===`);
  process.exit(1);
}
console.log('=== PERMISSION MATRIX PASSED ===');
