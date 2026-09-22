import LiveBoard from '@/components/public/live/LiveBoard';
import { loadPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';
import { requireViewer } from '@/lib/auth/resolveActor';

export const metadata = {
  title: 'ผลสด — Sci Games 2026',
  description: 'คะแนนสดทุกชนิดกีฬา อัปเดตทันทีจากสนาม',
};

export const dynamic = 'force-dynamic';

// Internal live board (referees / admins / venue screens). Spectators see
// only "กำลังแข่ง" on /results — no scores until a match is finished.
export default async function LivePage() {
  await requireViewer('/live');
  const initial = await loadPage('/live', loadLiveData, EMPTY_LIVE);
  return <LiveBoard initial={initial} />;
}
