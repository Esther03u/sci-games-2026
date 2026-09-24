import ResultsBoard from '@/components/public/results/ResultsBoard';
import PlacementBoard from '@/components/public/results/PlacementBoard';
import { loadPublicPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';
import { loadPlacements } from '@/lib/queries/placements';

export const metadata = {
  title: 'ผลการแข่งขัน',
  description: 'สรุปคะแนน สถิติ และผลการแข่งขันครบทุกชนิดกีฬาในงาน Sci Games 2026',
};

// ISR like /schedule: the HTML is cached at the edge for 30 s and the client
// then polls /api/live-summary (also cached), so a big crowd costs Supabase
// one read per window instead of one per viewer. Spectators see no live
// scores anyway, so 30 s of staleness is invisible to them.
export const revalidate = 30;

const NO_PLACEMENTS = { events: [], standings: [], points: [], revealed: false };

export default async function ResultsPage() {
  const [initial, placements] = await Promise.all([
    loadPublicPage('/results', (sb) => loadLiveData(sb, { publicView: true }), EMPTY_LIVE),
    loadPlacements().catch((err) => {
      console.error('/results placements:', err);
      return NO_PLACEMENTS;
    }),
  ]);
  return (
    <>
      <ResultsBoard initial={initial} />
      {placements.events.length > 0 && (
        <PlacementBoard
          events={placements.events}
          // overall totals only once the podium is opened
          standings={placements.revealed ? placements.standings : []}
          teams={initial.teams}
          points={placements.revealed ? placements.points : []}
          revealed={placements.revealed}
        />
      )}
    </>
  );
}
