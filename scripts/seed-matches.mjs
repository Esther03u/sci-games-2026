// Import the official handbook schedule (src/lib/tournamentData.js) into the
// `matches` table as upcoming fixtures. Sports and teams are matched by name
// against the seeded rows, so run supabase/seed.sql (and migration 004) first.
//
//   node scripts/seed-matches.mjs --dry      # show what would be inserted
//   node scripts/seed-matches.mjs            # insert (refuses if matches exist)
//   node scripts/seed-matches.mjs --replace  # delete non-bracket matches first
//
// Scores/results in the handbook file are sample data and are NOT imported.
import { adminClient, hasFlag } from './lib/env.mjs';
import { OFFICIAL_SPORTS, OFFICIAL_TEAMS, OFFICIAL_MATCHES } from '../src/lib/tournamentData.js';

const admin = adminClient();
const dry = hasFlag('dry');
const replace = hasFlag('replace');

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

const rows = [];
const skipped = [];
for (const m of OFFICIAL_MATCHES) {
  const sport_id = sportByHandbookId[m.sport_id];
  const team_a_id = teamByHandbookId[m.team_a_id];
  const team_b_id = teamByHandbookId[m.team_b_id];
  if (!sport_id || !team_a_id || !team_b_id) {
    skipped.push(`${m.id}: unknown sport/team (${m.sport_id}, ${m.team_a_id}, ${m.team_b_id})`);
    continue;
  }
  rows.push({
    sport_id,
    team_a_id,
    team_b_id,
    match_date: m.match_date,
    match_time: m.match_time,
    venue: m.court || m.venue || 'TBA',
    round: m.round || null,
    category: m.category || null,
    match_number: m.match_number ?? null,
    status: 'upcoming',
  });
}

console.log(`handbook: ${OFFICIAL_MATCHES.length} matches → ${rows.length} importable, ${skipped.length} skipped`);
for (const s of skipped) console.log('  skip', s);
console.log(`db: ${existing} existing matches`);

if (dry) {
  const bySport = {};
  for (const r of rows) bySport[sports.find((s) => s.id === r.sport_id).name] = (bySport[sports.find((s) => s.id === r.sport_id).name] || 0) + 1;
  console.log('would insert per sport:', bySport);
  process.exit(0);
}

if (existing > 0 && !replace) {
  console.error('matches table is not empty — re-run with --replace to delete non-bracket matches first, or --dry to preview');
  process.exit(1);
}

if (replace && existing > 0) {
  const { error, count } = await admin.from('matches').delete({ count: 'exact' }).is('next_match_id', null).is('loser_next_match_id', null).not('round', 'in', '("semi_1","semi_2","third","final")');
  if (error) throw error;
  console.log(`deleted ${count} existing non-bracket matches`);
}

const { error, count } = await admin.from('matches').insert(rows, { count: 'exact' });
if (error) throw error;
console.log(`inserted ${count ?? rows.length} matches`);
