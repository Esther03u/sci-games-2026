import MatchEditor from '@/components/admin/MatchEditor';
import { loadPage } from '@/lib/queries/page';
import { loadMatchesPage } from '@/lib/queries/admin';

export const metadata = {
  title: 'จัดการการแข่งขัน - Admin',
  description: 'ระบบบันทึกผลและจัดการแมตช์การแข่งขัน Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  const { matches, sports, teams } = await loadPage('/admin/matches', loadMatchesPage, {
    matches: [],
    sports: [],
    teams: [],
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">จัดการและบันทึกผลการแข่งขัน</h1>
        <p className="page-subtitle">สร้างแมตช์ใหม่ อัปเดตผลคะแนนแบบเรียลไทม์ และเปลี่ยนสถานะการแข่งขัน</p>
      </div>

      <MatchEditor initialMatches={matches} sports={sports} teams={teams} />
    </div>
  );
}
