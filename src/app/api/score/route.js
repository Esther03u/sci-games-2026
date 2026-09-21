import { requireScorerForSport, actorToRpc } from '@/lib/auth/resolveActor';
import { callScoringRpc, getMatchSport, badRequest, notFound, isUuid } from '@/lib/api/scoring';

// POST /api/score  { match_id, team: 'a'|'b', delta: int }
// The +1 / -1 button. Every call becomes a row in score_events.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return badRequest('ข้อมูลไม่ถูกต้อง');

  const { match_id, team, delta } = body;
  if (!isUuid(match_id)) return badRequest('match_id ไม่ถูกต้อง');
  if (team !== 'a' && team !== 'b') return badRequest('team ต้องเป็น a หรือ b', 'INVALID_TEAM');
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 10) {
    return badRequest('delta ต้องเป็นจำนวนเต็ม -10 ถึง 10 และไม่ใช่ 0', 'INVALID_DELTA');
  }

  const match = await getMatchSport(match_id);
  if (!match) return notFound('ไม่พบแมตช์นี้');

  const guard = await requireScorerForSport(match.sport_id);
  if (guard.response) return guard.response;

  return callScoringRpc('apply_score_event', {
    p_match_id: match_id,
    p_team: team,
    p_delta: delta,
    p_actor: actorToRpc(guard.actor),
  });
}
