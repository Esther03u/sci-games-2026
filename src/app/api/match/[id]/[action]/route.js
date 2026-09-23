import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireScorerForSport, actorToRpc } from '@/lib/auth/resolveActor';
import {
  callScoringRpc,
  getMatchSport,
  badRequest,
  notFound,
  isUuid,
  scoringPaused,
  rpcErrorResponse,
} from '@/lib/api/scoring';
import { calculateWalkoverScore } from '@/lib/scoring-walkover';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/match/[id]/[action]
//   start        staff/pin/admin   upcoming -> live
//   finish-set   staff/pin/admin   close current set (set sports only)
//   finish       staff/pin/admin   live -> finished
//   reopen       admin             finished -> live
//   override     admin             { score_a, score_b, sets_a, sets_b } set directly
//   walkover     staff/pin/admin   { winner: 'a'|'b', reason?: string } declare walkover
const ACTIONS = {
  start: { fn: 'start_match', adminOnly: false },
  'finish-set': { fn: 'finish_set', adminOnly: false },
  finish: { fn: 'finish_match', adminOnly: false },
  reopen: { fn: 'reopen_match', adminOnly: true },
  override: { fn: 'override_score', adminOnly: true },
  walkover: { fn: null, adminOnly: false },
};

const toIntOrNull = (v) => (Number.isInteger(v) ? v : null);

export async function POST(request, { params }) {
  const { id, action } = await params;
  const spec = ACTIONS[action];
  if (!spec) return notFound('ไม่รู้จักคำสั่งนี้');
  if (!isUuid(id)) return badRequest('match id ไม่ถูกต้อง');

  const match = await getMatchSport(id);
  if (!match) return notFound('ไม่พบแมตช์นี้');

  const guard = await requireScorerForSport(match.sport_id);
  if (guard.response) return guard.response;
  const { actor } = guard;
  const paused = await scoringPaused(actor);
  if (paused) return paused;

  if (spec.adminOnly && actor.type !== 'admin') {
    return NextResponse.json(
      { success: false, error_code: 'ADMIN_ONLY', message: 'เฉพาะผู้ดูแลระบบเท่านั้น' },
      { status: 403 }
    );
  }

  // Handle Walkover (ชนะบาย)
  if (action === 'walkover') {
    const body = await request.json().catch(() => null);
    const winner = body?.winner;
    if (winner !== 'a' && winner !== 'b') {
      return badRequest('กรุณาระบุทีมที่ชนะบาย (a หรือ b)');
    }

    const supabase = createAdminClient();
    const { data: fullMatch, error: matchErr } = await supabase
      .from('matches')
      .select('id, sport_id, status, team_a_id, team_b_id, sports(scoring_type, sets_to_win, points_per_set)')
      .eq('id', id)
      .maybeSingle();

    if (matchErr || !fullMatch) return notFound('ไม่พบข้อมูลแมตช์');
    if (fullMatch.status === 'finished') {
      return badRequest('แมตช์นี้จบการแข่งขันไปแล้ว หากต้องการเปลี่ยนผลกรุณาเปิดแมตช์ใหม่ก่อน');
    }

    // 1. If match is upcoming or postponed, start it first
    if (fullMatch.status === 'upcoming' || fullMatch.status === 'postponed') {
      const { error: startErr } = await supabase.rpc('start_match', {
        p_match_id: id,
        p_actor: actorToRpc(actor),
      });
      if (startErr) return rpcErrorResponse(startErr);
    }

    // 2. Calculate standard walkover scores based on sport scoring type
    const scores = calculateWalkoverScore(fullMatch.sports, winner);

    // 3. Override score using admin actor privileges so DB triggers and sets match
    const overrideActor = {
      type: 'admin',
      admin_user_id: actor.type === 'admin' ? actor.admin_user_id : null,
      label: `${actor.label || 'Staff'} (Walkover)`,
    };
    const { error: overrideErr } = await supabase.rpc('override_score', {
      p_match_id: id,
      p_score_a: scores.score_a,
      p_score_b: scores.score_b,
      p_sets_a: scores.sets_a,
      p_sets_b: scores.sets_b,
      p_actor: overrideActor,
    });
    if (overrideErr) return rpcErrorResponse(overrideErr);

    // 4. Finish the match (triggers auto-advance bracket and calculates match points)
    const { data: finishedMatch, error: finishErr } = await supabase.rpc('finish_match', {
      p_match_id: id,
      p_actor: actorToRpc(actor),
    });
    if (finishErr) return rpcErrorResponse(finishErr);

    // 5. Update is_walkover flag on matches table
    try {
      await supabase.from('matches').update({ is_walkover: true }).eq('id', id);
    } catch (e) {
      console.warn('is_walkover column update skipped:', e);
    }

    revalidatePath('/schedule');
    revalidatePath('/results');
    revalidatePath('/');
    revalidatePath('/api/live-summary');

    return NextResponse.json({
      success: true,
      data: {
        ...(finishedMatch || fullMatch),
        ...scores,
        status: 'finished',
        is_walkover: true,
      },
    });
  }

  const rpcParams = { p_match_id: id, p_actor: actorToRpc(actor) };

  if (action === 'override') {
    const body = await request.json().catch(() => null);
    if (!body) return badRequest('ข้อมูลไม่ถูกต้อง');
    Object.assign(rpcParams, {
      p_score_a: toIntOrNull(body.score_a),
      p_score_b: toIntOrNull(body.score_b),
      p_sets_a: toIntOrNull(body.sets_a),
      p_sets_b: toIntOrNull(body.sets_b),
    });
  }

  const result = await callScoringRpc(spec.fn, rpcParams);

  // If match was reopened, reset is_walkover to false
  if (action === 'reopen' && result.status === 200) {
    try {
      const supabase = createAdminClient();
      await supabase.from('matches').update({ is_walkover: false }).eq('id', id);
    } catch (e) {
      // ignore if column doesn't exist
    }
    revalidatePath('/schedule');
    revalidatePath('/results');
    revalidatePath('/');
    revalidatePath('/api/live-summary');
  }

  return result;
}
