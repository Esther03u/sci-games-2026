import { NextResponse } from 'next/server';
import { getPodiumSettings } from '@/lib/queries/podium';

export const dynamic = 'force-dynamic';

// Every spectator on / polls this every 8 s (PodiumCountdown). The 5 s edge
// cache means Supabase is read at most once per 5 s however many people are
// watching; an admin change reaches viewers within ~13 s.
export async function GET() {
  const data = await getPodiumSettings();
  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=5',
      },
    }
  );
}
