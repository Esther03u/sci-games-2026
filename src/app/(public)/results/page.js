import ResultsBoard from '@/components/public/results/ResultsBoard';
import { loadPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';

export const metadata = {
  title: 'ผลการแข่งขัน',
  description: 'สรุปคะแนน สถิติ และผลการแข่งขันครบทุกชนิดกีฬาในงาน Sci Games 2026',
};

// Same realtime pipeline as /live: server-rendered initial data, then
// useLiveScores keeps it current on the client.
export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  const initial = await loadPage('/results', (sb) => loadLiveData(sb, { publicView: true }), EMPTY_LIVE);
  return <ResultsBoard initial={initial} />;
}
