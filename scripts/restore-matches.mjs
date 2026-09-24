// Restore missing handbook matches without deleting existing matches.
// Links bracket progression and resets stale winner/loser slots in finals/3rd-place.
import { adminClient } from './lib/env.mjs';
import { OFFICIAL_SPORTS, OFFICIAL_TEAMS, OFFICIAL_MATCHES, splitVenueCourt } from '../src/data/handbook.js';

const admin = adminClient();

async function restore() {
  console.log('--- Restoring missing matches from handbook ---');
  const [{ data: sports }, { data: teams }, { data: existingMatches }] = await Promise.all([
    admin.from('sports').select('id, name'),
    admin.from('teams').select('id, name'),
    admin.from('matches').select('*'),
  ]);

  const sportByHandbookId = Object.fromEntries(
    OFFICIAL_SPORTS.map((s) => [s.id, sports.find((d) => d.name === s.name)?.id])
  );
  const teamByHandbookId = Object.fromEntries(
    OFFICIAL_TEAMS.map((t) => [t.id, teams.find((d) => d.name === t.name)?.id])
  );

  const findDbMatch = (m, allMatches = existingMatches) => {
    const sId = sportByHandbookId[m.sport_id];
    return allMatches.find(
      (d) =>
        d.sport_id === sId &&
        d.match_date === m.match_date &&
        String(d.match_time).slice(0, 5) === String(m.match_time).slice(0, 5) &&
        (d.category || null) === (m.category || null) &&
        (d.match_number ?? null) === (m.match_number ?? null)
    );
  };

  const missing = OFFICIAL_MATCHES.filter((m) => !findDbMatch(m));
  console.log(
    `Found ${missing.length} missing matches in DB:`,
    missing.map((m) => m.id)
  );

  if (missing.length === 0) {
    console.log('All 44 matches are already in DB!');
    return;
  }

  // Insert missing matches
  const rowsToInsert = missing.map((m) => ({
    sport_id: sportByHandbookId[m.sport_id],
    team_a_id: m.team_a_id ? teamByHandbookId[m.team_a_id] : null,
    team_b_id: m.team_b_id ? teamByHandbookId[m.team_b_id] : null,
    match_date: m.match_date,
    match_time: m.match_time,
    ...splitVenueCourt(m),
    round: m.round || null,
    category: m.category || null,
    match_number: m.match_number ?? null,
    status: 'upcoming',
  }));

  const { data: inserted, error: insertErr } = await admin.from('matches').insert(rowsToInsert).select('*');

  if (insertErr) throw insertErr;
  console.log(`Successfully inserted ${inserted.length} matches.`);

  // Refetch all matches to get full list with IDs
  const { data: allMatches, error: refetchErr } = await admin.from('matches').select('*');
  if (refetchErr) throw refetchErr;

  // Wire bracket links (next_match_id, loser_next_match_id) for the missing matches
  for (const m of missing) {
    const insertedMatch = findDbMatch(m, allMatches);
    if (!insertedMatch) {
      console.warn(`Could not find newly inserted match for handbook ID ${m.id}`);
      continue;
    }

    const patch = {};
    if (m.next_match_id) {
      const nextHandbook = OFFICIAL_MATCHES.find((x) => x.id === m.next_match_id);
      const nextDb = nextHandbook ? findDbMatch(nextHandbook, allMatches) : null;
      if (nextDb) {
        patch.next_match_id = nextDb.id;
        patch.next_match_slot = m.next_match_slot;
      }
    }
    if (m.loser_next_match_id) {
      const loserHandbook = OFFICIAL_MATCHES.find((x) => x.id === m.loser_next_match_id);
      const loserDb = loserHandbook ? findDbMatch(loserHandbook, allMatches) : null;
      if (loserDb) {
        patch.loser_next_match_id = loserDb.id;
        patch.loser_next_match_slot = m.loser_next_match_slot;
      }
    }

    if (Object.keys(patch).length > 0) {
      const { error: linkErr } = await admin.from('matches').update(patch).eq('id', insertedMatch.id);
      if (linkErr) throw linkErr;
      console.log(`Wired bracket links for ${m.id} -> ${JSON.stringify(patch)}`);
    }
  }

  // Clean stale teams from downstream matches
  const downstreamHandbookIds = [
    'futsal-m5',
    'futsal-m6',
    'futsal-m7',
    'futsal-m8',
    'petanque-m11',
    'petanque-m12',
  ];
  for (const tid of downstreamHandbookIds) {
    const hb = OFFICIAL_MATCHES.find((x) => x.id === tid);
    const db = hb ? findDbMatch(hb, allMatches) : null;
    if (db) {
      const expectedTeamA = hb.team_a_id ? teamByHandbookId[hb.team_a_id] : null;
      const expectedTeamB = hb.team_b_id ? teamByHandbookId[hb.team_b_id] : null;
      if (db.team_a_id !== expectedTeamA || db.team_b_id !== expectedTeamB) {
        const { error: resetErr } = await admin
          .from('matches')
          .update({ team_a_id: expectedTeamA, team_b_id: expectedTeamB })
          .eq('id', db.id);
        if (resetErr) throw resetErr;
        console.log(
          `Cleaned stale teams for ${tid} (${db.round}): team_a=${expectedTeamA}, team_b=${expectedTeamB}`
        );
      }
    }
  }

  // Audit log
  await admin.from('audit_logs').insert({
    action: 'restore_matches',
    target_type: 'matches',
    target_id: null,
    actor_email: 'admin@system',
    actor_name: 'Super Admin',
    details: {
      message:
        'Restored 3 deleted handbook matches (futsal-m1, futsal-m2, petanque-m6) and cleaned stale bracket slots',
      restored_count: missing.length,
      matches: missing.map((m) => m.id),
    },
  });

  const { count: finalCount } = await admin.from('matches').select('*', { count: 'exact', head: true });
  console.log(`\nDONE: Database now has ${finalCount} matches (expected 44).`);
}

restore().catch((e) => {
  console.error(e);
  process.exit(1);
});
