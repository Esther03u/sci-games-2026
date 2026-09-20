import ScoreInput from '@/components/staff/ScoreInput';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'บันทึกคะแนนสนาม - Staff',
  description: 'ระบบบันทึกผลการแข่งขันสำหรับ Staff Sci Games 2026',
};

export const dynamic = 'force-dynamic';

const DEFAULT_EDIT_WINDOW_MINUTES = 10;

// app_settings is admin-only under RLS, so read it with the service role.
async function getEditWindowMinutes() {
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

// Live + upcoming, plus matches finished recently enough that staff may
// still correct them (the DB enforces the window; this is just the list).
async function loadMatches(supabase, editWindowMinutes) {
  const since = new Date(Date.now() - editWindowMinutes * 60 * 1000).toISOString();
  return supabase
    .from('matches')
    .select('*')
    .or(`status.neq.finished,finished_at.gte.${since}`)
    .order('match_date')
    .order('match_time');
}

export default async function StaffScoringPage() {
  let matches = [];
  let sports = [];
  let teams = [];
  const editWindowMinutes = await getEditWindowMinutes();

  try {
    const supabase = await createServerSupabaseClient();
    const [matchesRes, sportsRes, teamsRes] = await Promise.all([
      loadMatches(supabase, editWindowMinutes),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('teams').select('*').order('sort_order'),
    ]);

    if (matchesRes.data) matches = matchesRes.data;
    if (sportsRes.data) sports = sportsRes.data;
    if (teamsRes.data) teams = teamsRes.data;
  } catch (err) {
    console.error('Error loading staff scoring page:', err);
  }

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <ScoreInput
        matches={matches}
        sports={sports}
        teams={teams}
        editWindowMinutes={editWindowMinutes}
      />
    </div>
  );
}
