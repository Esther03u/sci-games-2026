import { requireAdmin, actorToRpc } from '@/lib/auth/resolveActor';
import { callScoringRpc, badRequest, isUuid } from '@/lib/api/scoring';

const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/admin/bracket
// { sport_id, seeds:[4 team uuids], semi_date, semi_time_1, semi_time_2,
//   final_date, third_time, final_time, venue }
// Creates semi_1 (seed1 v seed4), semi_2 (seed2 v seed3), third, final.
export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || !isUuid(body.sport_id)) return badRequest('กรุณาเลือกกีฬา');

  const seeds = Array.isArray(body.seeds) ? body.seeds : [];
  if (seeds.length !== 4 || !seeds.every(isUuid) || new Set(seeds).size !== 4) {
    return badRequest('ต้องเลือก 4 ทีมที่ไม่ซ้ำกัน', 'BRACKET_NEEDS_4_DISTINCT_SEEDS');
  }
  for (const k of ['semi_date', 'final_date']) {
    if (!DATE_RE.test(body[k] || '')) return badRequest(`${k} ต้องเป็น YYYY-MM-DD`);
  }
  for (const k of ['semi_time_1', 'semi_time_2', 'third_time', 'final_time']) {
    if (!TIME_RE.test(body[k] || '')) return badRequest(`${k} ต้องเป็น HH:MM`);
  }

  return callScoringRpc('generate_bracket', {
    p_sport_id: body.sport_id,
    p_opts: {
      seeds,
      semi_date: body.semi_date,
      semi_time_1: body.semi_time_1,
      semi_time_2: body.semi_time_2,
      final_date: body.final_date,
      third_time: body.third_time,
      final_time: body.final_time,
      venue: String(body.venue || 'TBA').trim() || 'TBA',
    },
    p_actor: actorToRpc(guard.actor),
  });
}
