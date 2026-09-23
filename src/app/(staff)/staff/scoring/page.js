import ScoreInput from '@/components/staff/ScoreInput';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireScorer } from '@/lib/auth/resolveActor';
import { getEditWindowMinutes, loadScoringPage } from '@/lib/queries/staff';

export const metadata = {
  title: 'บันทึกคะแนนสนาม - Staff',
  description: 'ระบบบันทึกผลการแข่งขันสำหรับ Staff Sci Games 2026',
};

export const dynamic = 'force-dynamic';

// Referees signed in with a PIN are `anon` to Supabase, and 007 took anon's
// SELECT on matches away, so this page reads with the service role once the
// guard has confirmed who is asking (the staff layout guards the UI as well).
export default async function StaffScoringPage() {
  const guard = await requireScorer();
  const editWindowMinutes = await getEditWindowMinutes();
  let data = { matches: [], sports: [], teams: [] };
  if (!guard.response) {
    try {
      data = await loadScoringPage(createAdminClient(), editWindowMinutes);
    } catch (err) {
      console.error('Error loading /staff/scoring:', err);
    }
  }
  const { matches, sports, teams } = data;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <ScoreInput matches={matches} sports={sports} teams={teams} editWindowMinutes={editWindowMinutes} />
    </div>
  );
}
