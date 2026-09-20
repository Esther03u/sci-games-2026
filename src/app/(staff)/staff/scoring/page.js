import ScoreInput from '@/components/staff/ScoreInput';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'บันทึกคะแนนสนาม - Staff',
  description: 'ระบบบันทึกผลการแข่งขันสำหรับ Staff Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function StaffScoringPage() {
  let matches = [];
  let sports = [];
  let teams = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [matchesRes, sportsRes, teamsRes] = await Promise.all([
      supabase
        .from('matches')
        .select('*')
        .neq('status', 'finished')
        .order('match_date')
        .order('match_time'),
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
      <ScoreInput matches={matches} sports={sports} teams={teams} />
    </div>
  );
}
