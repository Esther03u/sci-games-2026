import { loadEnv, adminClient, anonClient, projectRef } from './scripts/lib/env.mjs';
const BASE = process.argv[2] || 'http://localhost:3000';
const env = loadEnv(); const REF = projectRef(env); const admin = adminClient(env); const anon = anonClient(env);
const TAG = `apifix-${Date.now()}`;
const c = { authUserId: null, adminUserId: null, pinId: null, matchId: null };
const cookieOf = (s) => `sb-${REF}-auth-token=${encodeURIComponent('base64-' + Buffer.from(JSON.stringify(s)).toString('base64url'))}`;
try {
  const { data: teams } = await admin.from('teams').select('id').order('sort_order');
  const { data: sports } = await admin.from('sports').select('id, scoring_type').order('sort_order');
  const futsal = sports.find((s) => s.scoring_type === 'points');
  const email = `${TAG}@example.invalid`, password = `P-${Date.now()}-x`;
  const { data: au } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  c.authUserId = au.user.id;
  const { data: row } = await admin.from('admin_users').insert({ auth_user_id: au.user.id, display_name: 'ApiFix', role: 'super_admin' }).select().single();
  c.adminUserId = row.id;
  const { data: si } = await anon.auth.signInWithPassword({ email, password });
  const adminCookie = cookieOf(si.session);
  const { data: m } = await admin.from('matches').insert({ sport_id: futsal.id, team_a_id: teams[0].id, team_b_id: teams[1].id, match_date: new Date().toISOString().slice(0,10), match_time: '17:00', venue: TAG, status: 'live', score_a: 61, score_b: 12 }).select().single();
  c.matchId = m.id;
  const pin = await fetch(`${BASE}/api/admin/pins`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ sport_id: futsal.id, label: `${TAG} ref` }) }).then(r => r.json());
  c.pinId = pin.data?.id;
  const loginRes = await fetch(`${BASE}/api/pin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sport_id: futsal.id, pin: pin.data?.pin }) });
  const pinCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];
  const get = async (label, cookie) => {
    const r = await fetch(`${BASE}/api/match/${m.id}`, { headers: cookie ? { Cookie: cookie } : {} });
    const j = await r.json();
    console.log(` ${label}: ${r.status} score=${j.data?.score_a}-${j.data?.score_b} sets_a=${j.data?.sets_a} last_scored=${j.data?.last_scored_team} match_sets=${JSON.stringify(j.data?.match_sets)}`);
  };
  console.log(`[live match ${TAG}] (จริงคือ 61-12)`);
  await get('ไม่ล็อกอิน  ', null);
  await get('กรรมการ PIN', pinCookie);
  await get('แอดมิน     ', adminCookie);
  await admin.from('matches').update({ status: 'finished', score_a: 61, score_b: 12 }).eq('id', m.id);
  console.log('[หลังจบแมตช์]');
  await get('ไม่ล็อกอิน  ', null);
} finally {
  if (c.matchId) await admin.from('matches').delete().eq('id', c.matchId);
  if (c.pinId) await admin.from('sport_pins').delete().eq('id', c.pinId);
  if (c.adminUserId) { await admin.from('audit_logs').delete().eq('admin_user_id', c.adminUserId); await admin.from('admin_users').delete().eq('id', c.adminUserId); }
  if (c.authUserId) await admin.auth.admin.deleteUser(c.authUserId);
  const { count } = await admin.from('matches').select('id', { count: 'exact', head: true });
  console.log('cleanup, matches:', count);
}
