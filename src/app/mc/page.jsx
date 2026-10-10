import McTeleprompter from '@/components/admin/McTeleprompter';
import { loadPlacements } from '@/lib/queries/placements';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'โพยสคริปต์พิธีกร (MC Cue Sheet) — Sci Games 2026',
  description: 'ระบบโพยสคริปต์ประกาศผลรางวัลบนเวทีแบบสดสำหรับพิธีกร',
};

export const dynamic = 'force-dynamic';

export default async function McPage() {
  const sb = createAdminClient();
  const [{ events, standings }, sRows, tRows] = await Promise.all([
    loadPlacements(sb),
    getSports(sb),
    getTeams(sb),
  ]);

  return (
    <McTeleprompter
      initialEvents={events || []}
      initialStandings={standings || []}
      sports={rows(sRows)}
      teams={rows(tRows)}
    />
  );
}
