import { getBracketMatches, getMatches, getRecentEvents, getSports, getTeams, rows } from './core';
import { loadPlacements } from './placements';

export async function loadAuditPage(sb) {
  const [events, logs, sports, teams, matches] = await Promise.all([
    getRecentEvents(sb, 500),
    sb
      .from('audit_logs')
      .select('*, admin_users(display_name)')
      .order('created_at', { ascending: false })
      .limit(300),
    getSports(sb, 'id, name, scoring_type'),
    getTeams(sb, 'id, name, color_hex'),
    sb.from('matches').select('id, sport_id, team_a_id, team_b_id, match_date, match_time, round, status'),
  ]);
  return {
    events: rows(events),
    logs: rows(logs),
    sports: rows(sports),
    teams: rows(teams),
    matches: rows(matches),
  };
}

export async function loadBracketPage(sb) {
  const [sports, teams, matches] = await Promise.all([getSports(sb), getTeams(sb), getBracketMatches(sb)]);
  return { sports: rows(sports), teams: rows(teams), matches: rows(matches) };
}

export async function loadMatchesPage(sb) {
  const [matches, sports, teams] = await Promise.all([
    sb
      .from('matches')
      .select('*, match_sets(*)')
      .order('match_date', { ascending: false })
      .order('match_time'),
    getSports(sb),
    getTeams(sb),
  ]);
  return { matches: rows(matches), sports: rows(sports), teams: rows(teams) };
}

export async function loadDashboard(sb) {
  const today = new Date().toISOString().split('T')[0];
  const [athletesCount, matches, placements, sports, teams] = await Promise.all([
    sb.from('athletes').select('id', { count: 'exact', head: true }),
    sb.from('matches').select('*').order('match_time'),
    // overall standings by placement (lib/placements) — admins always see them
    loadPlacements(),
    getSports(sb),
    getTeams(sb),
  ]);
  const all = rows(matches);
  const todayMatches = all.filter((m) => m.match_date === today);
  const finished = all.filter((m) => m.status === 'finished');
  const standingRows = placements.standings;
  return {
    stats: {
      totalAthletes: athletesCount.count || 0,
      todayMatches: todayMatches.length,
      finishedMatches: finished.length,
      totalMatches: all.length,
      topTeam: standingRows[0] || null,
    },
    todayMatchesList: todayMatches.length > 0 ? todayMatches : all.slice(0, 3),
    standings: standingRows,
    placementProgress: {
      done: placements.events.filter((e) => e.done).length,
      total: placements.events.length,
      points: placements.points,
    },
    sports: rows(sports),
    teams: rows(teams),
  };
}

export async function loadSportsOnly(sb, cols = 'id, name') {
  return { sports: rows(await getSports(sb, cols)) };
}

export { getMatches };
