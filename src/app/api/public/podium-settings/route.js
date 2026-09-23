import { NextResponse } from 'next/server';
import { getPodiumSettings } from '@/lib/queries/podium';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getPodiumSettings();
  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
