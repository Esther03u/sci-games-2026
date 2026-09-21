import { createAdminClient } from '@/lib/supabase/admin';
import { getSports, getTeams, rows } from './core';

export const DEFAULT_EDIT_WINDOW_MINUTES = 10;

// app_settings is admin-only under RLS, so read it with the service role.
export async function getEditWindowMinutes() {
  try {
    const { data } = await createAdminClient()
      .from('app_settings')
      .select('value')
      .eq('key', 'score_edit_window_minutes')
      .maybeSingle();
    const n = Number(data?.value);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_EDIT_WINDOW_MINUTES;
  } catch {
    return DEFAULT_EDIT_WINDOW_MINUTES;
  }
}

/**
 * Matches the scoring pad lists: live + upcoming, plus matches finished
 * recently enough that staff may still correct them (the DB enforces the
 * window; this only shapes the list).
 */
export async function loadScoringPage(sb, editWindowMinutes) {
  const since = new Date(Date.now() - editWindowMinutes * 60 * 1000).toISOString();
  const [matches, sports, teams] = await Promise.all([
    sb.from('matches').select('*').or(`status.neq.finished,finished_at.gte.${since}`).order('match_date').order('match_time'),
    getSports(sb),
    getTeams(sb),
  ]);
  return { matches: rows(matches), sports: rows(sports), teams: rows(teams) };
}
