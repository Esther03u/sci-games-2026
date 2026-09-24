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
import { createAuditLog } from '@/lib/audit';

// POST /api/match/[id]/[action]
//   start        staff/pin/admin   upcoming -> live
//   finish-set   staff/pin/admin   close current set (set sports only)
//   finish       staff/pin/admin   live -> finished
//   reopen       admin             finished -> live
//   override     admin             { score_a, score_b, sets_a, sets_b, sets?: [] } set directly
//   walkover     staff/pin/admin   { winner: 'a'|'b', reason?: string } declare walkover
//   reset        admin             reset match back to upcoming and revert bracket progression
const ACTIONS = {
  start: { fn: 'start_match', adminOnly: false },
  'finish-set': { fn: 'finish_set', adminOnly: false },
  finish: { fn: 'finish_match', adminOnly: false },
  reopen: { fn: 'reopen_match', adminOnly: true },
  override: { fn: 'override_score', adminOnly: true },
  walkover: { fn: null, adminOnly: false },
  reset: { fn: null, adminOnly: true },
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

  // Handle Reset (รีเซ็ตผลการแข่งกลับเป็นยังไม่แข่ง)
  if (action === 'reset') {
    const supabase = createAdminClient();
    const { data: fullMatch, error: matchErr } = await supabase
      .from('matches')
      .select('*, sports(name, scoring_type)')
      .eq('id', id)
      .maybeSingle();

    if (matchErr || !fullMatch) return notFound('ไม่พบข้อมูลแมตช์');

    // Check if next match in bracket has already started/finished
    if (fullMatch.next_match_id) {
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('id, status, round')
        .eq('id', fullMatch.next_match_id)
        .maybeSingle();

      if (nextMatch && nextMatch.status !== 'upcoming') {
        return badRequest(
          `ไม่สามารถรีเซ็ตได้ เนื่องจากแมตช์รอบถัดไป (${nextMatch.round || 'รอบถัดไป'}) กำลังแข่งขันหรือจบไปแล้ว กรุณารีเซ็ตแมตช์รอบถัดไปก่อน`
        );
      }

      // Revert winner in next match slot
      if (fullMatch.next_match_slot === 'a') {
        await supabase.from('matches').update({ team_a_id: null }).eq('id', fullMatch.next_match_id);
      } else if (fullMatch.next_match_slot === 'b') {
        await supabase.from('matches').update({ team_b_id: null }).eq('id', fullMatch.next_match_id);
      }
    }

    if (fullMatch.loser_next_match_id) {
      const { data: loserMatch } = await supabase
        .from('matches')
        .select('id, status, round')
        .eq('id', fullMatch.loser_next_match_id)
        .maybeSingle();

      if (loserMatch && loserMatch.status !== 'upcoming') {
        return badRequest(
          `ไม่สามารถรีเซ็ตได้ เนื่องจากแมตช์ชิงอันดับ 3 (${loserMatch.round || 'ชิงอันดับ 3'}) กำลังแข่งขันหรือจบไปแล้ว กรุณารีเซ็ตแมตช์นั้นก่อน`
        );
      }

      // Revert loser in next match slot
      if (fullMatch.loser_next_match_slot === 'a') {
        await supabase.from('matches').update({ team_a_id: null }).eq('id', fullMatch.loser_next_match_id);
      } else if (fullMatch.loser_next_match_slot === 'b') {
        await supabase.from('matches').update({ team_b_id: null }).eq('id', fullMatch.loser_next_match_id);
      }
    }

    // Delete score_events and match_sets for this match
    await supabase.from('score_events').delete().eq('match_id', id);
    await supabase.from('match_sets').delete().eq('match_id', id);

    // Reset match columns to upcoming baseline
    const { data: resetRow, error: updateErr } = await supabase
      .from('matches')
      .update({
        status: 'upcoming',
        score_a: null,
        score_b: null,
        sets_a: 0,
        sets_b: 0,
        points_a: null,
        points_b: null,
        current_set: 1,
        last_score_at: null,
        last_scored_team: null,
        started_at: null,
        finished_at: null,
        is_walkover: false,
      })
      .eq('id', id)
      .select('*, match_sets(*), sports(scoring_type, sets_to_win, points_per_set)')
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, message: updateErr.message }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    if (actor.admin_user_id) {
      await createAuditLog({
        adminUserId: actor.admin_user_id,
        action: 'reset_match',
        targetType: 'matches',
        targetId: id,
        oldValues: {
          status: fullMatch.status,
          score_a: fullMatch.score_a,
          score_b: fullMatch.score_b,
          sets_a: fullMatch.sets_a,
          sets_b: fullMatch.sets_b,
        },
        newValues: {
          status: 'upcoming',
          reason: body?.reason || 'แอดมินรีเซ็ตผลการแข่งขันกลับเป็นยังไม่แข่ง',
        },
      });
    }

    revalidatePath('/schedule');
    revalidatePath('/results');
    revalidatePath('/');
    revalidatePath('/api/live-summary');

    return NextResponse.json({ success: true, data: resetRow });
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

    if (actor.admin_user_id) {
      await createAuditLog({
        adminUserId: actor.admin_user_id,
        action: 'walkover_match',
        targetType: 'matches',
        targetId: id,
        newValues: { winner, reason: body?.reason || 'ชนะบาย' },
      });
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

    // If sets array provided, upsert into match_sets
    if (Array.isArray(body.sets) && body.sets.length > 0) {
      const supabase = createAdminClient();
      for (const s of body.sets) {
        if (s.set_number && s.score_a !== undefined && s.score_b !== undefined) {
          const sa = parseInt(s.score_a, 10);
          const sb = parseInt(s.score_b, 10);
          if (!Number.isNaN(sa) && !Number.isNaN(sb)) {
            await supabase.from('match_sets').upsert(
              {
                match_id: id,
                set_number: s.set_number,
                score_a: sa,
                score_b: sb,
                status: 'finished',
                finished_at: new Date().toISOString(),
              },
              { onConflict: 'match_id, set_number' }
            );
          }
        }
      }
    }

    if (body.reason && actor.admin_user_id) {
      await createAuditLog({
        adminUserId: actor.admin_user_id,
        action: 'override_score',
        targetType: 'matches',
        targetId: id,
        newValues: {
          score_a: body.score_a,
          score_b: body.score_b,
          sets_a: body.sets_a,
          sets_b: body.sets_b,
          reason: body.reason,
        },
      });
    }
  }

  const result = await callScoringRpc(spec.fn, rpcParams);

  // If match was reopened, reset is_walkover to false
  if (action === 'reopen' && result.status === 200) {
    try {
      const supabase = createAdminClient();
      await supabase.from('matches').update({ is_walkover: false }).eq('id', id);
      if (actor.admin_user_id) {
        await createAuditLog({
          adminUserId: actor.admin_user_id,
          action: 'reopen_match',
          targetType: 'matches',
          targetId: id,
          newValues: { status: 'live' },
        });
      }
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
