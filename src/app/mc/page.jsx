import McTeleprompter from '@/components/admin/McTeleprompter';
import { loadPlacements, visibleStandings } from '@/lib/queries/placements';
import { resolveAdminActor } from '@/lib/auth/resolveActor';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'โพยสคริปต์พิธีกร (MC Cue Sheet) — Sci Games 2026',
  description: 'ระบบโพยสคริปต์ประกาศผลรางวัลบนเวทีแบบสดสำหรับพิธีกร',
};

export const dynamic = 'force-dynamic';

export default async function McPage() {
  const sb = createAdminClient();
  const [placements, sRows, tRows, admin] = await Promise.all([
    loadPlacements(sb),
    getSports(sb),
    getTeams(sb),
    resolveAdminActor(),
  ]);
  // overall totals only after the reveal, or for a signed-in admin (/api/ceremony/live does the same)
  const events = placements.events;
  const standings = visibleStandings(placements, Boolean(admin));

  return (
    <McTeleprompter
      initialEvents={events || []}
      initialStandings={standings || []}
      sports={rows(sRows)}
      teams={rows(tRows)}
    />
  );
}
