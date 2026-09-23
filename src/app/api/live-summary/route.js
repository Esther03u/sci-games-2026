import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getSports, getTeams, rows } from '@/lib/queries/core';

// One shared, cached feed for spectator pages.
//
// Before this, every visitor of /results queried Supabase directly every 30 s
// (matches + sports + teams). On the free tier's 5 GB monthly egress that adds
// up fast: ~200 people × a whole match day would have blown the quota. This
// endpoint answers from the Vercel edge cache instead, so Supabase is hit once
// per revalidation window no matter how many people are watching.
//
// It reads `matches_public_v2` with the anon client, so a live match carries no
// score even if this route is called directly (migrations 007/010 do the masking).
export const revalidate = 30;

const MATCH_COLUMNS =
  'id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status, round, category, match_number, score_a, score_b, sets_a, sets_b, finished_at';

export async function GET() {
  const sb = createPublicSupabaseClient();
  try {
    const [matches, sports, teams] = await Promise.all([
      sb.from('matches_public_v2').select(MATCH_COLUMNS).order('match_date').order('match_time'),
      getSports(sb, 'id, name, sport_type, scoring_type, sort_order, icon'),
      getTeams(sb, 'id, name, color_hex, logo_emoji, sort_order'),
    ]);
    const body = { sports: rows(sports), teams: rows(teams), matches: rows(matches), sets: [], events: [] };
    return NextResponse.json(
      { success: true, data: body },
      // max-age=0 so a viewer's browser always asks (otherwise it caches
      // heuristically and never sees a status change); s-maxage lets the CDN
      // answer those asks for 30 s, which is what keeps Supabase idle.
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('live-summary:', err);
    return NextResponse.json({ success: false, message: 'โหลดข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}
