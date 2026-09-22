import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Error codes RAISEd by the functions in supabase/migrations/002_live_scoring.sql,
// mapped to an HTTP status and a message the staff UI can show as-is.
const RPC_ERRORS = {
  MATCH_NOT_FOUND: [404, 'ไม่พบแมตช์นี้'],
  EVENT_NOT_FOUND: [404, 'ไม่พบรายการคะแนนนี้'],
  MATCH_NOT_LIVE: [409, 'แมตช์ยังไม่เริ่มหรือจบไปแล้ว'],
  MATCH_ALREADY_FINISHED: [409, 'แมตช์นี้จบไปแล้ว'],
  MATCH_TEAMS_NOT_SET: [409, 'ยังไม่ทราบทีมที่แข่ง (รอผลรอบก่อนหน้า)'],
  EDIT_WINDOW_CLOSED: [409, 'หมดเวลาแก้ไขคะแนนแล้ว กรุณาติดต่อผู้ดูแลระบบ'],
  SET_IS_TIED: [409, 'คะแนนเซตเสมอกัน ยังจบเซตไม่ได้'],
  NOT_A_SET_SPORT: [400, 'กีฬานี้ไม่ได้นับเป็นเซต'],
  ADMIN_ONLY: [403, 'เฉพาะผู้ดูแลระบบเท่านั้น'],
  CANNOT_UNDO_OTHERS_EVENT: [403, 'ยกเลิกได้เฉพาะรายการที่คุณเป็นคนกดเท่านั้น'],
  EVENT_ALREADY_UNDONE: [409, 'รายการนี้ถูกยกเลิกไปแล้ว'],
  ONLY_SCORE_EVENTS_CAN_BE_UNDONE: [400, 'ยกเลิกได้เฉพาะรายการคะแนน'],
  EVENT_FROM_PREVIOUS_SET: [409, 'รายการนี้อยู่ในเซตก่อนหน้า ยกเลิกไม่ได้แล้ว'],
  INVALID_TEAM: [400, 'ทีมไม่ถูกต้อง'],
  INVALID_DELTA: [400, 'ค่าคะแนนไม่ถูกต้อง'],
  BRACKET_ALREADY_EXISTS: [409, 'กีฬานี้มีสายแข่งอยู่แล้ว'],
  BRACKET_NEEDS_4_DISTINCT_SEEDS: [400, 'ต้องเลือก 4 ทีมที่ไม่ซ้ำกัน'],
};

// Postgres puts the RAISE text in error.message, e.g. "EDIT_WINDOW_CLOSED: match finished ..."
export function mapRpcError(error) {
  const text = error?.message || '';
  const code = Object.keys(RPC_ERRORS).find((c) => text.startsWith(c));
  if (code) {
    const [status, message] = RPC_ERRORS[code];
    return { status, body: { success: false, error_code: code, message } };
  }
  console.error('Unmapped scoring RPC error:', error);
  return {
    status: 500,
    body: { success: false, error_code: 'RPC_ERROR', message: 'ระบบขัดข้อง กรุณาลองใหม่' },
  };
}

export function rpcErrorResponse(error) {
  const { status, body } = mapRpcError(error);
  return NextResponse.json(body, { status });
}

// Call one of the scoring functions with the service role and wrap the result.
export async function callScoringRpc(fn, params) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(fn, params);
  if (error) return rpcErrorResponse(error);
  return NextResponse.json({ success: true, data });
}

export async function getMatchSport(matchId) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('matches').select('id, sport_id').eq('id', matchId).maybeSingle();
  return data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

export const badRequest = (message, error_code = 'INVALID_BODY') =>
  NextResponse.json({ success: false, error_code, message }, { status: 400 });

export const notFound = (message = 'ไม่พบข้อมูล') =>
  NextResponse.json({ success: false, error_code: 'NOT_FOUND', message }, { status: 404 });
