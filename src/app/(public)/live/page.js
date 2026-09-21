import LiveBoard from '@/components/public/live/LiveBoard';
import { loadPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';

export const metadata = {
  title: 'ผลสด — Sci Games 2026',
  description: 'คะแนนสดทุกชนิดกีฬา อัปเดตทันทีจากสนาม',
};

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  const initial = await loadPage('/live', loadLiveData, EMPTY_LIVE);
  return <LiveBoard initial={initial} />;
}
