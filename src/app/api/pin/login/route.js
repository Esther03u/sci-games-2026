import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { PIN_COOKIE, signPinSession, pinCookieOptions, pinSessionConfigured } from '@/lib/auth/pinSession';
import { badRequest, isUuid } from '@/lib/api/scoring';

// POST /api/pin/login  { sport_id, pin }
// Temporary referees: a 6-digit PIN issued per sport by an admin.
export async function POST(request) {
  if (!pinSessionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'PIN_DISABLED',
        message: 'ระบบ PIN ยังไม่ได้เปิดใช้งาน (ไม่มี PIN_SESSION_SECRET)',
      },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const rl = await rateLimit({ key: `pin-login:${ip}`, limit: 5, windowMs: 600000 });
  if (!rl.success) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'RATE_LIMITED',
        message: 'ใส่ PIN ผิดหลายครั้ง กรุณารอ 10 นาทีแล้วลองใหม่',
      },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !isUuid(body.sport_id)) return badRequest('กรุณาเลือกกีฬา');
  const pin = String(body.pin || '').trim();
  if (!/^\d{6}$/.test(pin)) return badRequest('PIN ต้องเป็นตัวเลข 6 หลัก', 'INVALID_PIN');

  const supabase = createAdminClient();
  const { data: candidates } = await supabase
    .from('sport_pins')
    .select('id, sport_id, label, pin_hash, expires_at, sports(name)')
    .eq('sport_id', body.sport_id)
    .eq('is_active', true);

  const now = new Date();
  let matched = null;
  for (const c of candidates || []) {
    if (c.expires_at && new Date(c.expires_at) < now) continue;
    if (await bcrypt.compare(pin, c.pin_hash)) {
      matched = c;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json(
      { success: false, error_code: 'INVALID_PIN', message: 'PIN ไม่ถูกต้องหรือหมดอายุ' },
      { status: 401 }
    );
  }

  await supabase.from('sport_pins').update({ last_used_at: now.toISOString() }).eq('id', matched.id);

  const token = await signPinSession({ pinId: matched.id, sportId: matched.sport_id, label: matched.label });
  const res = NextResponse.json({
    success: true,
    data: { label: matched.label, sport_id: matched.sport_id, sport_name: matched.sports?.name },
  });
  res.cookies.set(PIN_COOKIE, token, pinCookieOptions());
  return res;
}
