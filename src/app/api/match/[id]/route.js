import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { badRequest, notFound, isUuid } from '@/lib/api/scoring';

export const dynamic = 'force-dynamic';

// GET /api/match/[id] — current match row plus its sets. Public data (same as RLS public_read).
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
  return NextResponse.json({ success: true, data });
}
