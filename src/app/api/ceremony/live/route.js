import { NextResponse } from 'next/server';
import { loadPlacements } from '@/lib/queries/placements';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ceremony/live
 * Provides live updated placement and overall standings for the MC stage teleprompter.
 * Edge cached for 5s to preserve database resources while maintaining real-time freshness.
 */
export async function GET() {
  try {
    const sb = createAdminClient();
    const [{ events, standings }, sRows, tRows] = await Promise.all([
      loadPlacements(sb),
      getSports(sb),
      getTeams(sb),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          events: events || [],
          standings: standings || [],
          sports: rows(sRows),
          teams: rows(tRows),
          timestamp: Date.now(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (err) {
    console.error('GET /api/ceremony/live failed:', err);
    return NextResponse.json(
      { success: false, message: 'โหลดข้อมูลสคริปต์พิธีกรไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
