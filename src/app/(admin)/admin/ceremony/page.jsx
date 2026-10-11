import CeremonyConsole from '@/components/admin/CeremonyConsole';
import { loadPlacements, visibleStandings } from '@/lib/queries/placements';
import { resolveAdminActor } from '@/lib/auth/resolveActor';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';
import { mcAccessKey } from '@/lib/auth/mcKey';

export const metadata = {
  title: 'พิธีมอบรางวัลและสคริปต์พิธีกร - Admin',
  description: 'ระบบจัดพิมพ์สคริปต์ผลการแข่งขันและลำดับพิธีมอบรางวัล Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminCeremonyPage() {
  const sb = createAdminClient();
  const [placements, sRows, tRows, admin] = await Promise.all([
    loadPlacements(sb),
    getSports(sb),
    getTeams(sb),
    resolveAdminActor(),
  ]);
  // proxy.js only checks for a session, so totals and the MC's secret link (overall
  // totals before the reveal without a login) go to a verified admin only
  const { events } = placements;
  const standings = visibleStandings(placements, Boolean(admin));
  const key = admin ? mcAccessKey() : null;
  const mcPath = key ? `/mc?k=${key}` : '/mc';

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
        mcPath={mcPath}
      />
    </div>
  );
}
