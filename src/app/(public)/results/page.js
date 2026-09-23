import ResultsBoard from '@/components/public/results/ResultsBoard';
import { loadPublicPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';

export const metadata = {
  title: 'ผลการแข่งขัน',
  description: 'สรุปคะแนน สถิติ และผลการแข่งขันครบทุกชนิดกีฬาในงาน Sci Games 2026',
};

// ISR like /schedule: the HTML is cached at the edge for 30 s and the client
// then polls /api/live-summary (also cached), so a big crowd costs Supabase
// one read per window instead of one per viewer. Spectators see no live
// scores anyway, so 30 s of staleness is invisible to them.
export const revalidate = 30;

export default async function ResultsPage() {
  const initial = await loadPublicPage(
    '/results',
    (sb) => loadLiveData(sb, { publicView: true }),
    EMPTY_LIVE
  );
  return <ResultsBoard initial={initial} />;
}
