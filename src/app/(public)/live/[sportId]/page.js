import SportLiveDetail from '@/components/public/live/SportLiveDetail';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';

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
  const initial = await loadPage('/live/[sportId]', loadLiveData, EMPTY_LIVE);
  return <SportLiveDetail sportId={sportId} initial={initial} />;
}
