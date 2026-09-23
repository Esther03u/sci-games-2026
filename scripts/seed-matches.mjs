// Import the official handbook schedule (src/data/handbook.js) into the
// `matches` table as upcoming fixtures. Sports and teams are matched by name
// against the seeded rows, so run supabase/seed.sql (and migration 004) first.
//
//   node scripts/seed-matches.mjs --dry      # show what would be inserted
//   node scripts/seed-matches.mjs            # insert (refuses if matches exist)
//   node scripts/seed-matches.mjs --replace  # delete non-bracket matches first
//   node scripts/seed-matches.mjs --force    # also delete matches that already
//                                            # carry bracket links (a re-seed)
//
// Scores/results in the handbook file are sample data and are NOT imported.
// After inserting, the handbook's next_match_id / loser_next_match_id are
// translated to the new uuids and written back, so finishing a first-round
// match moves the winner into the final and the loser into the third-place
// match (trigger in migration 002). Without that pass the knockout slots stay
// empty and someone has to fill them by hand.
import { adminClient, hasFlag } from './lib/env.mjs';
import { OFFICIAL_SPORTS, OFFICIAL_TEAMS, OFFICIAL_MATCHES } from '../src/data/handbook.js';

const admin = adminClient();
const dry = hasFlag('dry');
const replace = hasFlag('replace');
const force = hasFlag('force');

const [{ data: sports }, { data: teams }, { count: existing }] = await Promise.all([
  admin.from('sports').select('id, name'),
  admin.from('teams').select('id, name'),
  admin.from('matches').select('*', { count: 'exact', head: true }),
]);

const sportByHandbookId = Object.fromEntries(
  OFFICIAL_SPORTS.map((s) => [s.id, sports.find((d) => d.name === s.name)?.id])
);
const teamByHandbookId = Object.fromEntries(
  OFFICIAL_TEAMS.map((t) => [t.id, teams.find((d) => d.name === t.name)?.id])
);

// Petanque's handbook venue names the court inside the ground
// ('สนามเปตอง สนาม 1 ม.ราชภัฏภูเก็ต' + court 'สนาม 1') → venue 'สนามเปตอง',
// court 'สนาม 1' (migration 010). For every other sport `court` is the ground.
function placeOf(m) {
  if (m.court && m.venue?.includes(` ${m.court} `)) {
    return { venue: m.venue.split(` ${m.court} `)[0], court: m.court };
  }
  return { venue: m.court || m.venue || 'TBA', court: null };
}

const rows = [];
const skipped = [];
for (const m of OFFICIAL_MATCHES) {
  const sport_id = sportByHandbookId[m.sport_id];
  const team_a_id = m.team_a_id ? teamByHandbookId[m.team_a_id] : null;
  const team_b_id = m.team_b_id ? teamByHandbookId[m.team_b_id] : null;
  if (!sport_id) {
    skipped.push(`${m.id}: unknown sport (${m.sport_id})`);
    continue;
  }
  if ((m.team_a_id && !team_a_id) || (m.team_b_id && !team_b_id)) {
    skipped.push(`${m.id}: unknown team (${m.team_a_id}, ${m.team_b_id})`);
    continue;
  }
  rows.push({
    handbook_id: m.id, // stripped before insert; used to wire the bracket after
    sport_id,
    team_a_id,
    team_b_id,
    match_date: m.match_date,
    match_time: m.match_time,
    ...placeOf(m),
    round: m.round || null,
    category: m.category || null,
    match_number: m.match_number ?? null,
    status: 'upcoming',
  });
}

console.log(
  `handbook: ${OFFICIAL_MATCHES.length} matches → ${rows.length} importable, ${skipped.length} skipped`
);
for (const s of skipped) console.log('  skip', s);
console.log(`db: ${existing} existing matches`);

if (dry) {
  const bySport = {};
  for (const r of rows)
    bySport[sports.find((s) => s.id === r.sport_id).name] =
      (bySport[sports.find((s) => s.id === r.sport_id).name] || 0) + 1;
  console.log('would insert per sport:', bySport);
  process.exit(0);
}

if (existing > 0 && !replace && !force) {
  console.error(
    'matches table is not empty — re-run with --replace (or --force to also drop linked bracket rows), or --dry to preview'
  );
  process.exit(1);
}

if ((replace || force) && existing > 0) {
  let q = admin.from('matches').delete({ count: 'exact' });
  if (!force) {
    // keep brackets generated elsewhere; NOT IN never matches NULL, so spell
    // out "no round or a non-bracket round"
    q = q
      .is('next_match_id', null)
      .is('loser_next_match_id', null)
      .or('round.is.null,round.not.in.("semi_1","semi_2","third","final")');
  } else {
    q = q.not('id', 'is', null);
  }
  const { error, count } = await q;
  if (error) throw error;
  console.log(`deleted ${count} existing matches${force ? ' (--force: including linked ones)' : ''}`);
}

const insertRows = rows.map(({ handbook_id, ...row }) => row);
const { data: inserted, error } = await admin
  .from('matches')
  .insert(insertRows)
  .select('id, sport_id, match_date, match_time, category, match_number');
if (error) throw error;
console.log(`inserted ${inserted.length} matches`);

// ---- second pass: translate the handbook's bracket links to the new uuids.
// Match the returned rows on their own values rather than trusting the order
// they come back in — nothing guarantees it mirrors the insert order.
const keyOf = (r) =>
  [r.sport_id, r.match_date, String(r.match_time).slice(0, 5), r.category ?? '', r.match_number ?? ''].join(
    '|'
  );
const uuidByKey = Object.fromEntries(inserted.map((r) => [keyOf(r), r.id]));
const uuidByHandbookId = {};
for (const r of rows) {
  const id = uuidByKey[keyOf(r)];
  if (!id) throw new Error(`cannot locate the inserted row for ${r.handbook_id}`);
  uuidByHandbookId[r.handbook_id] = id;
}
const links = [];
for (const m of OFFICIAL_MATCHES) {
  const id = uuidByHandbookId[m.id];
  if (!id || (!m.next_match_id && !m.loser_next_match_id)) continue;
  const patch = {};
  if (m.next_match_id) {
    patch.next_match_id = uuidByHandbookId[m.next_match_id];
    patch.next_match_slot = m.next_match_slot;
  }
  if (m.loser_next_match_id) {
    patch.loser_next_match_id = uuidByHandbookId[m.loser_next_match_id];
    patch.loser_next_match_slot = m.loser_next_match_slot;
  }
  const missing = Object.entries(patch).filter(([k, v]) => k.endsWith('_id') && !v);
  if (missing.length) {
    console.error(`  ! ${m.id}: cannot resolve ${missing.map(([k]) => k).join(', ')}`);
    continue;
  }
  links.push({ id, patch });
}

let linked = 0;
for (const { id, patch } of links) {
  const { error: linkErr } = await admin.from('matches').update(patch).eq('id', id);
  if (linkErr) throw linkErr;
  linked += 1;
}
console.log(`wired ${linked} matches into their bracket (winner → final, loser → third place)`);
