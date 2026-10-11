import McTeleprompter from '@/components/admin/McTeleprompter';
import { loadPlacements, visibleStandings } from '@/lib/queries/placements';
import { resolveAdminActor } from '@/lib/auth/resolveActor';
import { isValidMcKey } from '@/lib/auth/mcKey';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'โพยสคริปต์พิธีกร (MC Cue Sheet) — Sci Games 2026',
  description: 'ระบบโพยสคริปต์ประกาศผลรางวัลบนเวทีแบบสดสำหรับพิธีกร',
  // the secret link carries its key in the URL — never leak it through Referer
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function McPage({ searchParams }) {
  const { k } = (await searchParams) || {};
  const keyOk = isValidMcKey(k);
  const sb = createAdminClient();
  const [placements, sRows, tRows, admin] = await Promise.all([
    loadPlacements(sb),
    getSports(sb),
    getTeams(sb),
    resolveAdminActor(),
  ]);
  // overall totals only after the reveal, for a signed-in admin, or via the MC's
  // secret link (/api/ceremony/live does the same)
  const events = placements.events;
  const standings = visibleStandings(placements, keyOk || Boolean(admin));

  return (
    <McTeleprompter
      initialEvents={events || []}
      initialStandings={standings || []}
      sports={rows(sRows)}
      teams={rows(tRows)}
      accessKey={keyOk ? k : undefined}
    />
  );
}
