import CeremonyConsole from '@/components/admin/CeremonyConsole';
import { loadPlacements } from '@/lib/queries/placements';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'พิธีมอบรางวัลและสคริปต์พิธีกร - Admin',
  description: 'ระบบจัดพิมพ์สคริปต์ผลการแข่งขันและลำดับพิธีมอบรางวัล Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminCeremonyPage() {
  const sb = createAdminClient();
  const [{ events, standings }, sRows, tRows] = await Promise.all([
    loadPlacements(sb),
    getSports(sb),
    getTeams(sb),
  ]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title">พิธีมอบรางวัลและสคริปต์พิธีกร (MC Cue Sheet)</h1>
        <p className="page-subtitle">
          จัดลำดับการประกาศผลรางวัล 11 รายการ และสร้างเอกสาร A4 สำหรับพิธีกรบนเวที
        </p>
      </div>

      <CeremonyConsole
        events={events || []}
        standings={standings || []}
        sports={rows(sRows)}
        teams={rows(tRows)}
      />
    </div>
  );
}
