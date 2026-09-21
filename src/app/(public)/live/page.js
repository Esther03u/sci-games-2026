import LiveBoard from '@/components/public/live/LiveBoard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadLiveData } from '@/lib/live-data';

export const metadata = {
  title: 'ผลสด — Sci Games 2026',
  description: 'คะแนนสดทุกชนิดกีฬา อัปเดตทันทีจากสนาม',
};

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  let initial = { sports: [], teams: [], matches: [], sets: [] };
  try {
    initial = await loadLiveData(await createServerSupabaseClient());
  } catch (err) {
    console.error('Error loading /live:', err);
  }
  return <LiveBoard initial={initial} />;
}
