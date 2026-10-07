import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { PIN_COOKIE, pinCookieOptions, readPinSession } from '@/lib/auth/pinSession';

// POST /api/pin/logout — clears the PIN session cookie and active session in DB.
export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await readPinSession(cookieStore.get(PIN_COOKIE)?.value);
    if (session?.pinId && session?.sessionId) {
      const admin = createAdminClient();
      await admin
        .from('sport_pins')
        .update({ active_session_id: null })
        .eq('id', session.pinId)
        .eq('active_session_id', session.sessionId);
    }
  } catch (err) {
    console.error('pin logout error:', err);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(PIN_COOKIE, '', { ...pinCookieOptions(), maxAge: 0 });
  return res;
}
