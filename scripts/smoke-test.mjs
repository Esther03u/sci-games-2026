// End-to-end smoke test against a running dev server + the real Supabase
// project in .env.local. Creates a throwaway super_admin, a PIN, and test
// matches, drives the scoring API exactly like the staff UI does, then
// deletes everything it created.
//
//   npm run dev            (in another terminal)
//   node scripts/smoke-test.mjs [http://localhost:3000]
//
// Nothing here is kept: the temp admin, PIN, matches and their events are
// removed at the end (also on failure).
import { loadEnv, adminClient, anonClient, projectRef } from './lib/env.mjs';

const BASE = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3000';
const env = loadEnv();
const REF = projectRef(env);
const admin = adminClient(env);
const anon = anonClient(env);

const TAG = `smoke-${Date.now()}`;
const created = { authUserId: null, adminUserId: null, pinId: null, matchIds: [] };
let failures = 0;

const check = (name, cond, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures += 1;
};

// @supabase/ssr cookie encoding: base64-<base64url(JSON session)>, chunked by URI-encoded length.
function sessionCookies(session) {
  const key = `sb-${REF}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
  const encoded = encodeURIComponent(value);
  if (encoded.length <= 3180) return `${key}=${encoded}`;
  const parts = [];
  let rest = value;
  let i = 0;
  while (rest.length) {
    let head = rest.slice(0, 3000);
    parts.push(`${key}.${i}=${encodeURIComponent(head)}`);
    rest = rest.slice(head.length);
    i += 1;
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
  return { status: res.status, json, setCookie: res.headers.get('set-cookie') || '' };
}

async function cleanup() {
  console.log('\n[cleanup]');
  if (created.matchIds.length) await admin.from('matches').delete().in('id', created.matchIds);
  if (created.pinId) await admin.from('sport_pins').delete().eq('id', created.pinId);
  if (created.adminUserId) {
    await admin.from('audit_logs').delete().eq('admin_user_id', created.adminUserId);
    await admin.from('admin_users').delete().eq('id', created.adminUserId);
  }
  if (created.authUserId) await admin.auth.admin.deleteUser(created.authUserId);
  await admin.from('rate_limits').delete().like('key', 'pin-login:%');
  console.log('  removed temp admin, PIN, matches, events');
}

try {
  console.log(`smoke test → ${BASE} (project ${REF})`);

  // ---------------------------------------------------------------- fixtures
  const { data: teams } = await admin.from('teams').select('id, name').order('sort_order');
  const { data: sports } = await admin.from('sports').select('id, name, scoring_type').order('sort_order');
  const futsal = sports.find((s) => s.scoring_type === 'points');
  const volley = sports.find((s) => s.scoring_type === 'sets');
  check('seed present (4 teams, points + sets sport)', teams?.length === 4 && futsal && volley);

  const email = `${TAG}@example.invalid`;
  const password = `Smoke-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const { data: au, error: auErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (auErr) throw auErr;
  created.authUserId = au.user.id;
  const { data: adminRow } = await admin
    .from('admin_users')
    .insert({ auth_user_id: au.user.id, display_name: 'Smoke Admin', role: 'super_admin' })
    .select()
    .single();
  created.adminUserId = adminRow.id;

  const { data: signIn, error: siErr } = await anon.auth.signInWithPassword({ email, password });
  if (siErr) throw siErr;
  const adminCookie = sessionCookies(signIn.session);

  const today = new Date().toISOString().slice(0, 10);
  const mk = async (sport) => {
    const { data } = await admin
      .from('matches')
      .insert({
        sport_id: sport.id,
        team_a_id: teams[0].id,
        team_b_id: teams[1].id,
        match_date: today,
        match_time: '12:00',
        venue: TAG,
      })
      .select()
      .single();
    created.matchIds.push(data.id);
    return data;
  };
  const m1 = await mk(futsal);
  const m2 = await mk(volley);
  const m3 = await mk(futsal); // used for a forbidden check with a volley PIN? no — see below

  // ---------------------------------------------------------------- auth guards
  console.log('\n[auth]');
  let r = await call('GET', '/api/admin/pins');
  check('anonymous /api/admin/pins → 401', r.status === 401, `got ${r.status}`);
  r = await call('POST', '/api/register', { body: { student_id: TAG } });
  check('web registration closed → 410', r.status === 410, `got ${r.status}`);
  r = await call('GET', '/api/auth/me', { cookie: adminCookie });
  check(
    'admin session recognised by /api/auth/me',
    r.json.data?.type === 'admin',
    JSON.stringify(r.json.data)
  );

  // ---------------------------------------------------------------- PIN lifecycle
  console.log('\n[pin]');
  r = await call('POST', '/api/admin/pins', {
    cookie: adminCookie,
    body: { sport_id: volley.id, label: `${TAG} referee` },
  });
  check(
    'create PIN returns 6-digit pin once',
    r.status === 200 && /^\d{6}$/.test(r.json.data?.pin || ''),
    `status ${r.status}`
  );
  created.pinId = r.json.data?.id;
  const pin = r.json.data?.pin;

  r = await call('POST', '/api/pin/login', { body: { sport_id: volley.id, pin: '000000' } });
  check(
    'wrong PIN → 401',
    r.status === 401 || (r.status === 401 && r.json.error_code === 'INVALID_PIN'),
    `status ${r.status}`
  );
  r = await call('POST', '/api/pin/login', { body: { sport_id: volley.id, pin } });
  check(
    'correct PIN → cookie sg_pin',
    r.status === 200 && r.setCookie.includes('sg_pin='),
    `status ${r.status}`
  );
  const pinCookie = r.setCookie.split(';')[0];
  r = await call('GET', '/api/auth/me', { cookie: pinCookie });
  check(
    'PIN session recognised (type=pin, one sport)',
    r.json.data?.type === 'pin' && r.json.data?.sportIds?.[0] === volley.id,
    JSON.stringify(r.json.data)
  );

  // ---------------------------------------------------------------- permissions
  console.log('\n[permissions]');
  r = await call('POST', `/api/match/${m1.id}/start`, { cookie: pinCookie });
  check(
    'PIN for volleyball cannot start a futsal match → 403',
    r.status === 403,
    `status ${r.status} ${r.json.error_code || ''}`
  );
  r = await call('POST', '/api/score', { cookie: pinCookie, body: { match_id: m2.id, team: 'a', delta: 1 } });
  check(
    'scoring before start → 409 MATCH_NOT_LIVE',
    r.status === 409 && r.json.error_code === 'MATCH_NOT_LIVE',
    `status ${r.status} ${r.json.error_code || ''}`
  );
  r = await call('POST', `/api/match/${m2.id}/reopen`, { cookie: pinCookie });
  check('PIN cannot reopen (admin only) → 403', r.status === 403, `status ${r.status}`);

  // ---------------------------------------------------------------- points sport as admin
  console.log('\n[points sport: futsal, admin]');
  r = await call('POST', `/api/match/${m1.id}/start`, { cookie: adminCookie });
  check('start → live', r.json.data?.status === 'live', r.json.message);
  for (const [team, delta] of [
    ['a', 1],
    ['a', 1],
    ['b', 1],
    ['a', 1],
  ]) {
    r = await call('POST', '/api/score', { cookie: adminCookie, body: { match_id: m1.id, team, delta } });
  }
  check(
    '3 x +1 a, 1 x +1 b → 3-1',
    r.json.data?.score_a === 3 && r.json.data?.score_b === 1,
    `${r.json.data?.score_a}-${r.json.data?.score_b}`
  );
  check('last_scored_team = a', r.json.data?.last_scored_team === 'a');
  r = await call('POST', '/api/score', {
    cookie: adminCookie,
    body: { match_id: m1.id, team: 'b', delta: -1 },
  });
  check(
    '-1 b → 3-0, last_scored_team unchanged',
    r.json.data?.score_b === 0 && r.json.data?.last_scored_team === 'a'
  );
  r = await call('POST', '/api/score/undo', { cookie: adminCookie, body: { match_id: m1.id } });
  check(
    'undo my latest (the -1) → 3-1',
    r.json.data?.score_a === 3 && r.json.data?.score_b === 1,
    r.json.message
  );
  r = await call('POST', `/api/match/${m1.id}/finish`, { cookie: adminCookie });
  check(
    'finish → finished, points 3/0',
    r.json.data?.status === 'finished' && r.json.data?.points_a === 3 && r.json.data?.points_b === 0,
    r.json.message
  );
  {
    const { data: ev } = await admin
      .from('score_events')
      .select('event_type, delta, actor_type, actor_label')
      .eq('match_id', m1.id)
      .order('created_at');
    // start + 5 score (+1,+1,+1,+1,-1) + undo + finish_match
    check(
      'score_events recorded (start, 5 score, undo, finish)',
      ev?.length === 8 &&
        ev[0].event_type === 'start' &&
        ev.at(-1).event_type === 'finish_match' &&
        ev.filter((e) => e.event_type === 'undo').length === 1,
      `${ev?.length} rows`
    );
    check(
      'events carry actor label',
      ev?.every((e) => e.actor_label === 'Smoke Admin')
    );
  }
  r = await call('GET', `/api/match/${m1.id}`);
  check('GET /api/match/[id] public', r.status === 200 && r.json.data?.id === m1.id);

  // ---------------------------------------------------------------- sets sport as PIN
  console.log('\n[sets sport: volleyball, PIN referee]');
  r = await call('POST', `/api/match/${m2.id}/start`, { cookie: pinCookie });
  check(
    'PIN start → live, set 1',
    r.json.data?.status === 'live' && r.json.data?.current_set === 1,
    r.json.message
  );
  r = await call('POST', `/api/match/${m2.id}/finish-set`, { cookie: pinCookie });
  check(
    'finish-set at 0-0 → 409 SET_IS_TIED',
    r.status === 409 && r.json.error_code === 'SET_IS_TIED',
    `status ${r.status} ${r.json.error_code || ''}`
  );
  for (let i = 0; i < 3; i++)
    await call('POST', '/api/score', { cookie: pinCookie, body: { match_id: m2.id, team: 'a', delta: 1 } });
  r = await call('POST', `/api/match/${m2.id}/finish-set`, { cookie: pinCookie });
  check(
    'finish-set 3-0 → sets 1-0, set 2 opens at 0-0',
    r.json.data?.sets_a === 1 && r.json.data?.current_set === 2 && r.json.data?.score_a === 0,
    r.json.message
  );
  for (let i = 0; i < 2; i++)
    await call('POST', '/api/score', { cookie: pinCookie, body: { match_id: m2.id, team: 'b', delta: 1 } });
  r = await call('POST', `/api/match/${m2.id}/finish-set`, { cookie: pinCookie });
  check(
    'finish-set 0-2 → sets 1-1, set 3',
    r.json.data?.sets_b === 1 && r.json.data?.current_set === 3,
    r.json.message
  );
  await call('POST', '/api/score', { cookie: pinCookie, body: { match_id: m2.id, team: 'a', delta: 1 } });
  r = await call('POST', `/api/match/${m2.id}/finish`, { cookie: pinCookie });
  check(
    'finish with open set 1-0 → auto-close, sets 2-1, points 3/0',
    r.json.data?.sets_a === 2 && r.json.data?.sets_b === 1 && r.json.data?.points_a === 3,
    r.json.message
  );
  {
    const { data: sets } = await admin
      .from('match_sets')
      .select('set_number, score_a, score_b, status')
      .eq('match_id', m2.id)
      .order('set_number');
    check(
      'match_sets rows 3-0 / 0-2 / 1-0 all finished',
      sets?.length === 3 && sets.every((s) => s.status === 'finished') && sets[1].score_b === 2,
      JSON.stringify(sets)
    );
  }
  r = await call('POST', '/api/score', { cookie: pinCookie, body: { match_id: m2.id, team: 'b', delta: 1 } });
  check(
    'PIN edit right after finish (inside window) → allowed',
    r.status === 200,
    `status ${r.status} ${r.json.error_code || ''}`
  );
  r = await call('POST', '/api/score/undo', { cookie: adminCookie, body: { match_id: m2.id } });
  check(
    "admin undo by match_id reverses the PIN referee's latest event (admin may undo anyone)",
    r.status === 200 && r.json.data?.score_b === 0,
    `status ${r.status} score_b=${r.json.data?.score_b}`
  );

  // ---------------------------------------------------------------- standings + realtime publication
  console.log('\n[standings / realtime]');
  {
    const { data: st } = await anon.from('team_standings').select('name, total_points, wins');
    const top = st?.find((t) => t.name === teams[0].name);
    check(
      'team_standings via anon: team A has 2 wins / 6 pts',
      top?.wins === 2 && top?.total_points === 6,
      JSON.stringify(top)
    );
  }
  {
    const { data: pub } = await admin.rpc('check_rate_limit', {
      p_key: 'smoke',
      p_limit: 5,
      p_window_seconds: 60,
    });
    check('check_rate_limit() reachable', pub?.allowed === true);
  }
  {
    const live = anonClient(env);
    await live.auth.signInWithPassword({ email, password });
    // Realtime attaches the change listener slightly after SUBSCRIBED, so an
    // insert fired immediately can be missed: settle 1 s, then retry once at 6 s.
    const got = await new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (!done) {
          done = true;
          resolve(v);
        }
      };
      const score = () =>
        call('POST', '/api/score', {
          cookie: adminCookie,
          body: { match_id: m2.id, team: 'a', delta: 1 },
        });
      // since 007 only admin/staff sessions may read score_events, so the
      // subscriber signs in as the temp admin rather than plain anon
      live
        .channel(`smoke-${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'score_events' }, (p) =>
          finish(p.new)
        )
        .subscribe((s) => {
          if (s !== 'SUBSCRIBED') return;
          setTimeout(score, 1000);
          setTimeout(() => !done && score(), 6000);
        });
      setTimeout(() => finish(null), 15000);
    });
    check(
      'Realtime: score_events INSERT delivered to a staff subscriber',
      got?.delta === 1 && got?.team === 'a',
      got ? '' : 'timed out (is score_events in supabase_realtime publication?)'
    );
    await live.removeAllChannels();
  }
  {
    // ---- 007/008: a spectator must not be able to read a live score anywhere.
    // `anon` was signed in as the temp admin above, so use a fresh client, and
    // score a throwaway match that is still live at this point.
    console.log('\n[live scores hidden from spectators]');
    const spectator = anonClient(env);
    const { data: hidden } = await admin
      .from('matches')
      .insert({
        sport_id: futsal.id,
        team_a_id: teams[0].id,
        team_b_id: teams[1].id,
        match_date: today,
        match_time: '13:00',
        venue: TAG,
        status: 'live',
        score_a: 41,
        score_b: 17,
      })
      .select()
      .single();
    created.matchIds.push(hidden.id);

    for (const table of ['matches', 'match_sets', 'score_events']) {
      const r = await spectator.from(table).select('id').limit(1);
      check(
        `anon cannot read ${table}`,
        !!r.error || (r.data?.length ?? 0) === 0,
        r.error ? r.error.code : `${r.data.length} rows`
      );
    }
    const masked = await spectator
      .from('matches_public_v3')
      .select('status, score_a, score_b')
      .eq('id', hidden.id)
      .maybeSingle();
    check(
      'matches_public_v3 reports the live match without its score',
      masked.data?.status === 'live' && masked.data?.score_a === null && masked.data?.score_b === null,
      JSON.stringify(masked.data ?? masked.error?.code)
    );
    const viaApi = await fetch(`${BASE}/api/match/${hidden.id}`).then((r) => r.json());
    check(
      'GET /api/match/[id] hides the score from an anonymous caller',
      viaApi.data?.status === 'live' && viaApi.data?.score_a === null && viaApi.data?.score_b === null,
      JSON.stringify(viaApi.data && { a: viaApi.data.score_a, b: viaApi.data.score_b })
    );
    const viaApiPin = await fetch(`${BASE}/api/match/${hidden.id}`, {
      headers: { Cookie: pinCookie },
    }).then((r) => r.json());
    check(
      'GET /api/match/[id] still gives referees the real score',
      viaApiPin.data?.score_a === 41 && viaApiPin.data?.score_b === 17,
      JSON.stringify(viaApiPin.data && { a: viaApiPin.data.score_a, b: viaApiPin.data.score_b })
    );
    const html = await fetch(`${BASE}/results`).then((r) => r.text());
    const near = html.slice(Math.max(0, html.indexOf(TAG) - 1500), html.indexOf(TAG) + 1500);
    // match the JSON field itself — a bare ":41" also appears in timestamps
    check(
      'the /results payload carries no live score',
      !/score_a\?":\s*41|score_b\?":\s*17/.test(near),
      'searched the match markup'
    );
  }

  // ---------------------------------------------------------------- emergency switch
  console.log('\n[live_scoring_enabled switch]');
  {
    const m4 = await mk(volley);
    await call('POST', `/api/match/${m4.id}/start`, { cookie: adminCookie });
    await call('PATCH', '/api/admin/settings', {
      cookie: adminCookie,
      body: { key: 'live_scoring_enabled', value: false },
    });
    r = await call('POST', '/api/score', {
      cookie: pinCookie,
      body: { match_id: m4.id, team: 'a', delta: 1 },
    });
    check(
      'switch off → referee scoring refused (503 SCORING_PAUSED)',
      r.status === 503 && r.json.error_code === 'SCORING_PAUSED',
      `status ${r.status} ${r.json.error_code || ''}`
    );
    r = await call('POST', '/api/score', {
      cookie: adminCookie,
      body: { match_id: m4.id, team: 'a', delta: 1 },
    });
    check('switch off → admin can still score', r.status === 200, `status ${r.status}`);
    await call('PATCH', '/api/admin/settings', {
      cookie: adminCookie,
      body: { key: 'live_scoring_enabled', value: true },
    });
    r = await call('POST', '/api/score', {
      cookie: pinCookie,
      body: { match_id: m4.id, team: 'b', delta: 1 },
    });
    check('switch back on → referee scoring works again', r.status === 200, `status ${r.status}`);
  }

  // ---------------------------------------------------------------- pin revoke
  console.log('\n[pin revoke]');
  r = await call('PATCH', '/api/admin/pins', {
    cookie: adminCookie,
    body: { id: created.pinId, is_active: false },
  });
  check('deactivate PIN', r.status === 200 && r.json.data?.is_active === false);
  r = await call('GET', '/api/auth/me', { cookie: pinCookie });
  check('revoked PIN session → null immediately', r.json.data === null, JSON.stringify(r.json.data));
  r = await call('POST', '/api/score', { cookie: pinCookie, body: { match_id: m2.id, team: 'a', delta: 1 } });
  check('revoked PIN cannot score → 401', r.status === 401, `status ${r.status}`);
  void m3;

  // ---------------------------------------------------------------- admin crud (generic /api/admin/[resource])
  console.log('\n[admin crud]');
  r = await call('POST', '/api/admin/announcements', {
    cookie: adminCookie,
    body: { title: TAG, content: 'smoke', is_pinned: true },
  });
  check(
    'POST announcements → 200 + created_by = admin',
    r.status === 200 && r.json.data?.created_by === created.adminUserId,
    `status ${r.status} ${JSON.stringify(r.json)}`
  );
  const annId = r.json.data?.id;
  r = await call('PATCH', '/api/admin/announcements', {
    cookie: adminCookie,
    body: { id: annId, is_pinned: false },
  });
  check(
    'PATCH announcements → is_pinned false',
    r.status === 200 && r.json.data?.is_pinned === false,
    `status ${r.status}`
  );
  r = await call('PATCH', '/api/admin/announcements', {
    cookie: adminCookie,
    body: { id: annId, created_by: null },
  });
  check('PATCH non-whitelisted column → 400', r.status === 400, `status ${r.status}`);
  r = await call('POST', '/api/admin/matches', {
    cookie: adminCookie,
    body: {
      sport_id: futsal.id,
      team_a_id: teams[0].id,
      team_b_id: teams[0].id,
      match_date: today,
      match_time: '10:00',
      venue: TAG,
    },
  });
  check('POST matches same team → 400', r.status === 400, `status ${r.status}`);
  r = await call('POST', '/api/admin/teams', { cookie: adminCookie, body: { name: 'x' } });
  check('unknown resource → 404', r.status === 404, `status ${r.status}`);
  r = await call('POST', '/api/admin/announcements', {
    cookie: pinCookie,
    body: { title: 'x', content: 'y' },
  });
  check(
    'PIN session cannot use admin crud → 401/403',
    r.status === 401 || r.status === 403,
    `status ${r.status}`
  );
  r = await call('DELETE', `/api/admin/announcements?id=${annId}`, { cookie: adminCookie });
  check('DELETE announcements → 200', r.status === 200, `status ${r.status}`);
  {
    const { count } = await admin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('admin_user_id', created.adminUserId)
      .in('action', ['insert_announcements', 'update_announcements', 'delete_announcements']);
    check('audit_logs has insert/update/delete rows', count === 3, `got ${count}`);
  }
  {
    const { data: gone } = await admin.from('announcements').select('id').eq('id', annId).maybeSingle();
    check('announcement row removed', gone === null);
  }

  // ---------------------------------------------------------------- public pages (ISR + dynamic) render
  console.log('\n[public pages]');
  for (const path of ['/', '/results', '/schedule', '/news']) {
    const r = await fetch(`${BASE}${path}`);
    const html = await r.text();
    check(
      `GET ${path} → 200 with app shell`,
      r.status === 200 && html.includes('Sci Games'),
      `status ${r.status}`
    );
  }
  {
    // spectators must not reach the live board (decision 2026-09-22)
    // (public)/loading.js streams the shell first, so the redirect may arrive
    // as 200 + <meta http-equiv="refresh"> instead of a 307 Location header.
    const r = await fetch(`${BASE}/live`, { redirect: 'manual' });
    const loc = r.headers.get('location') || '';
    const html = r.status === 200 ? await r.text() : '';
    const metaRedirect = /http-equiv="refresh"[^>]*staff\/login\?next=%2Flive/.test(html);
    check(
      'GET /live (anon) → redirected to /staff/login?next=/live, no scores in HTML',
      ((r.status >= 300 && r.status < 400 && loc.includes('/staff/login')) || metaRedirect) &&
        !html.includes('live-grid'),
      `status ${r.status} ${loc || (metaRedirect ? '(meta refresh)' : '')}`
    );
  }
} catch (err) {
  failures += 1;
  console.error('\nUNEXPECTED ERROR:', err);
} finally {
  await cleanup();
}

console.log(failures ? `\n=== ${failures} CHECK(S) FAILED ===` : '\n=== ALL SMOKE CHECKS PASSED ===');
process.exit(failures ? 1 : 0);
