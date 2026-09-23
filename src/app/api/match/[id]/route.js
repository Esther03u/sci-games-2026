import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveActor } from '@/lib/auth/resolveActor';
import { maskLiveMatch } from '@/lib/api/publicMatch';
import { badRequest, notFound, isUuid } from '@/lib/api/scoring';

export const dynamic = 'force-dynamic';

// GET /api/match/[id] — current match row plus its sets.
// Referees/staff/admins get the real row (the scoring pad re-syncs from here).
// Everyone else gets it masked exactly like the matches_public_v2 view: no score
// while the match is live. This route reads with the service role, so RLS
// (migration 008) does not cover it — the check has to live here.
export async function GET(_request, { params }) {
  const { id } = await params;
  if (!isUuid(id)) return badRequest('match id ไม่ถูกต้อง');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*, match_sets(set_number, score_a, score_b, status)')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  if (!data) return notFound('ไม่พบแมตช์นี้');

  const actor = await resolveActor();
  return NextResponse.json({ success: true, data: actor ? data : maskLiveMatch(data) });
}
