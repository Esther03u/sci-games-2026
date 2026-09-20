import { requireScorerForSport, actorToRpc } from '@/lib/auth/resolveActor';
import { callScoringRpc, badRequest, notFound, isUuid } from '@/lib/api/scoring';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/score/undo  { event_id }  — reverse a specific score event
// POST /api/score/undo  { match_id }  — reverse the caller's latest score event on that match
// Staff/PIN may only undo their own events; admin may undo any.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return badRequest('ข้อมูลไม่ถูกต้อง');

  const supabase = createAdminClient();
  let event = null;

  if (isUuid(body.event_id)) {
    const { data } = await supabase
      .from('score_events')
      .select('id, match_id, matches(sport_id)')
      .eq('id', body.event_id)
      .maybeSingle();
    event = data;
    if (!event) return notFound('ไม่พบรายการคะแนนนี้');
  } else if (isUuid(body.match_id)) {
    const { data: match } = await supabase
      .from('matches')
      .select('id, sport_id')
      .eq('id', body.match_id)
      .maybeSingle();
    if (!match) return notFound('ไม่พบแมตช์นี้');

    const guard = await requireScorerForSport(match.sport_id);
    if (guard.response) return guard.response;
    const { actor } = guard;

    let q = supabase
      .from('score_events')
      .select('id, match_id, matches(sport_id)')
      .eq('match_id', body.match_id)
      .eq('event_type', 'score')
      .is('undone_by', null)
      .order('created_at', { ascending: false })
      .limit(1);
    if (actor.type === 'pin') q = q.eq('actor_pin_id', actor.pinId);
    else if (actor.type === 'staff') q = q.eq('actor_admin_user_id', actor.adminUserId);

    const { data } = await q.maybeSingle();
    if (!data) return notFound('ไม่มีรายการคะแนนของคุณให้ยกเลิก');

    return callScoringRpc('undo_score_event', { p_event_id: data.id, p_actor: actorToRpc(actor) });
  } else {
    return badRequest('ต้องระบุ event_id หรือ match_id');
  }

  const guard = await requireScorerForSport(event.matches?.sport_id);
  if (guard.response) return guard.response;

  return callScoringRpc('undo_score_event', {
    p_event_id: event.id,
    p_actor: actorToRpc(guard.actor),
  });
}
