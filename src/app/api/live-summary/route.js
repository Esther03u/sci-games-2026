import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { generateSummaryEtag } from '@/lib/data-etag';

// One shared, cached feed for spectator pages.
//
// Before this, every visitor of /results queried Supabase directly every 30 s
// (matches + sports + teams). On the free tier's 5 GB monthly egress that adds
// up fast: ~200 people × a whole match day would have blown the quota. This
// endpoint answers from the Vercel edge cache instead, so Supabase is hit once
// per revalidation window no matter how many people are watching.
//
// It reads `matches_public_v3` with the anon client. Since migration 015 live
// scores are public, so this feed is also how spectators follow a match live:
// pages poll it every 8 s instead of opening a Supabase Realtime connection
// each (the free tier allows 200 for the whole project, and the referees'
// scoring screens need them). The 5 s edge cache keeps it to at most one
// Supabase read per 5 s however many people are watching.
export const dynamic = 'force-dynamic';

const MATCH_COLUMNS =
  'id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status, round, category, match_number, score_a, score_b, sets_a, sets_b, current_set, finished_at, is_walkover';

const LEGACY_MATCH_COLUMNS =
  'id, sport_id, team_a_id, team_b_id, match_date, match_time, venue, court, status, round, category, match_number, score_a, score_b, sets_a, sets_b, finished_at';

export async function GET(request) {
  const sb = createPublicSupabaseClient();
  try {
    let matchesQuery = sb
      .from('matches_public_v3')
      .select(MATCH_COLUMNS)
      .order('match_date')
      .order('match_time');
    let [matches, sports, teams, sets] = await Promise.all([
      matchesQuery,
      getSports(sb, 'id, name, sport_type, scoring_type, sort_order, icon'),
      getTeams(sb, 'id, name, color_hex, logo_emoji, sort_order'),
      // per-set scores for the live boards; anon may read match_sets since 015
      sb.from('match_sets').select('id, match_id, set_number, score_a, score_b, status').order('set_number'),
    ]);

    // Fallback while migration 013 (v3 with is_walkover) is not on the database yet
    if (matches.error) {
      matches = await sb
        .from('matches_public_v2')
        .select(LEGACY_MATCH_COLUMNS)
        .order('match_date')
        .order('match_time');
    }

    const body = {
      sports: rows(sports),
      teams: rows(teams),
      matches: rows(matches),
      sets: sets.error ? [] : rows(sets),
      events: [],
    };
    const etag = generateSummaryEtag(body);

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

    return NextResponse.json({ success: true, data: body }, { headers });
  } catch (err) {
    console.error('live-summary:', err);
    return NextResponse.json({ success: false, message: 'โหลดข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}
