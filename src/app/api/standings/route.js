import { NextResponse } from 'next/server';
import { loadPlacements } from '@/lib/queries/placements';

export const dynamic = 'force-dynamic';

// GET /api/standings — overall standings by placement (lib/placements).
// Per-event 1st–4th are always returned (they follow from public results).
// The overall table and the points only come back once an admin has opened
// the podium (decision 25 ก.ย.: hidden until revealed) — the home page asks
// here at the moment of the reveal instead of shipping totals in its HTML.
// Short CDN cache: many screens may reveal at once.
export async function GET() {
  try {
    const { events, standings, points, revealed } = await loadPlacements();
    const body = revealed ? { revealed: true, points, events, standings } : { revealed: false, events };
    return NextResponse.json(
      { success: true, data: body },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=10' } }
    );
  } catch (err) {
    console.error('GET /api/standings failed:', err);
    return NextResponse.json({ success: false, message: 'โหลดคะแนนไม่สำเร็จ' }, { status: 500 });
  }
}
