import { createAdminClient } from '@/lib/supabase/admin';
import { computeEventPlacements, computeStandings, normalizePlacementPoints } from '@/lib/placements';

// Server-side loader for the placement standings (plan 2026-09-25). Reads the
// masked public view, so nothing live leaks; the service role is only needed
// for app_settings (anon has no policy on it).

/** placement_points, show_departments_public and the podium reveal state. */
export async function getPlacementSettings(sb = createAdminClient()) {
  const { data } = await sb
    .from('app_settings')
    .select('key, value')
    .in('key', ['placement_points', 'show_departments_public', 'podium_countdown']);
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  const podium = map.podium_countdown || {};
  return {
    points: normalizePlacementPoints(map.placement_points),
    showDepartments: map.show_departments_public === true,
    // totals stay hidden until an admin opens the podium (decision 25 ก.ย.)
    revealed: podium.revealed === true || podium.status === 'revealed' || podium.status === 'fast_forward',
  };
}

/** @returns {Promise<{events: ReturnType<typeof computeEventPlacements>, standings: ReturnType<typeof computeStandings>, points: number[], revealed: boolean, showDepartments: boolean}>} */
export async function loadPlacements(sb = createAdminClient()) {
  const [settings, matches, sports, teams] = await Promise.all([
    getPlacementSettings(sb),
    sb
      .from('matches_public_v3')
      .select('sport_id, category, round, team_a_id, team_b_id, status, score_a, score_b, sets_a, sets_b')
      .in('round', ['ชิงชนะเลิศ', 'ชิงอันดับ 3', 'final', 'third']),
    sb.from('sports').select('id, name, scoring_type, sort_order').order('sort_order'),
    sb.from('teams').select('id, name, color_hex, logo_emoji, sort_order').order('sort_order'),
  ]);
  const events = computeEventPlacements(matches.data || [], sports.data || []);
  return {
    ...settings,
    events,
    standings: computeStandings(events, teams.data || [], settings.points),
  };
}
