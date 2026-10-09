import LiveBoard from '@/components/public/live/LiveBoard';
import { loadPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';
import { resolveActor } from '@/lib/auth/resolveActor';

export const metadata = {
  title: 'ผลสด — Sci Games 2026',
  description: 'คะแนนสดทุกชนิดกีฬา อัปเดตทันทีจากสนาม',
};

export const dynamic = 'force-dynamic';

// Live board — public since migration 015. Signed-in referees / admins /
// venue screens get a Realtime channel; spectators poll the cached feed so
// they don't use up the free tier's 200 Realtime connections.
export default async function LivePage() {
  const [initial, actor] = await Promise.all([
    loadPage('/live', loadLiveData, EMPTY_LIVE),
    resolveActor().catch(() => null),
  ]);
  return <LiveBoard initial={initial} realtime={Boolean(actor)} />;
}
