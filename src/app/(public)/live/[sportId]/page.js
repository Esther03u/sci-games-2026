import SportLiveDetail from '@/components/public/live/SportLiveDetail';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadLiveData } from '@/lib/live-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { sportId } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('sports').select('name').eq('id', sportId).maybeSingle();
    return { title: `${data?.name || 'กีฬา'} — ผลสด Sci Games 2026` };
  } catch {
    return { title: 'ผลสด Sci Games 2026' };
  }
}

export default async function SportLivePage({ params }) {
  const { sportId } = await params;
  let initial = { sports: [], teams: [], matches: [], sets: [] };
  try {
    initial = await loadLiveData(await createServerSupabaseClient());
  } catch (err) {
    console.error('Error loading /live/[sportId]:', err);
  }
  return <SportLiveDetail sportId={sportId} initial={initial} />;
}
