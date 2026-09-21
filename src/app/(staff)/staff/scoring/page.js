import ScoreInput from '@/components/staff/ScoreInput';
import { loadPage } from '@/lib/queries/page';
import { getEditWindowMinutes, loadScoringPage } from '@/lib/queries/staff';

export const metadata = {
  title: 'บันทึกคะแนนสนาม - Staff',
  description: 'ระบบบันทึกผลการแข่งขันสำหรับ Staff Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function StaffScoringPage() {
  const editWindowMinutes = await getEditWindowMinutes();
  const { matches, sports, teams } = await loadPage(
    '/staff/scoring',
    (sb) => loadScoringPage(sb, editWindowMinutes),
    { matches: [], sports: [], teams: [] }
  );

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <ScoreInput matches={matches} sports={sports} teams={teams} editWindowMinutes={editWindowMinutes} />
    </div>
  );
}
