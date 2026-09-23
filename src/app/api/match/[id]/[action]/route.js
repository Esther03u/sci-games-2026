import { NextResponse } from 'next/server';
import { requireScorerForSport, actorToRpc } from '@/lib/auth/resolveActor';
import {
  callScoringRpc,
  getMatchSport,
  badRequest,
  notFound,
  isUuid,
  scoringPaused,
} from '@/lib/api/scoring';

// POST /api/match/[id]/[action]
//   start        staff/pin/admin   upcoming -> live
//   finish-set   staff/pin/admin   close current set (set sports only)
//   finish       staff/pin/admin   live -> finished
//   reopen       admin             finished -> live
//   override     admin             { score_a, score_b, sets_a, sets_b } set directly
const ACTIONS = {
  start: { fn: 'start_match', adminOnly: false },
  'finish-set': { fn: 'finish_set', adminOnly: false },
  finish: { fn: 'finish_match', adminOnly: false },
  reopen: { fn: 'reopen_match', adminOnly: true },
  override: { fn: 'override_score', adminOnly: true },
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

  return callScoringRpc(spec.fn, rpcParams);
}
