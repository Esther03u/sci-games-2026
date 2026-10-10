import { NextResponse } from 'next/server';
import { loadPlacements } from '@/lib/queries/placements';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCeremonyEtag } from '@/lib/data-etag';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ceremony/live
 * Provides live updated placement and overall standings for the MC stage teleprompter.
 * Supports conditional HTTP 304 Not Modified via If-None-Match ETag header.
 * Edge cached for 5s to preserve database resources while maintaining real-time freshness.
 */
export async function GET(request) {
  try {
    const sb = createAdminClient();
    const [{ events, standings }, sRows, tRows] = await Promise.all([
      loadPlacements(sb),
      getSports(sb),
      getTeams(sb),
    ]);

    const body = {
      events: events || [],
      standings: standings || [],
      sports: rows(sRows),
      teams: rows(tRows),
      timestamp: Date.now(),
    };

    const etag = generateCeremonyEtag(body);
    const clientEtag = request?.headers?.get('if-none-match');
    const headers = {
      'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=10',
      ETag: etag,
    };

    if (clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: body,
      },
      { headers }
    );
  } catch (err) {
    console.error('GET /api/ceremony/live failed:', err);
    return NextResponse.json(
      { success: false, message: 'โหลดข้อมูลสคริปต์พิธีกรไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
