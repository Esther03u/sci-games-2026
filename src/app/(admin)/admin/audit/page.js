import AuditLog from '@/components/admin/AuditLog';
import { loadPage } from '@/lib/queries/page';
import { loadAuditPage } from '@/lib/queries/admin';

export const metadata = {
  title: 'ประวัติการแก้ไข - Admin',
  description: 'ประวัติคะแนนทุกการกดและการเปลี่ยนแปลงข้อมูลโดยผู้ดูแล',
};

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const { events, logs, sports, teams, matches } = await loadPage('/admin/audit', loadAuditPage, {
    events: [],
    logs: [],
    sports: [],
    teams: [],
    matches: [],
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">
          ประวัติการแก้ไข
        </h1>
        <p className="page-subtitle">
          ทุกการกด +1/−1 จากสนาม และทุกการเปลี่ยนแปลงข้อมูลโดยผู้ดูแล — ย้อนคะแนนที่ผิดได้จากที่นี่
        </p>
      </div>
      <AuditLog events={events} logs={logs} sports={sports} teams={teams} matches={matches} />
    </div>
  );
}
