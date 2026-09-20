import { NextResponse } from 'next/server';
import { PIN_COOKIE, pinCookieOptions } from '@/lib/auth/pinSession';

// POST /api/pin/logout — clears the PIN session cookie.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(PIN_COOKIE, '', { ...pinCookieOptions(), maxAge: 0 });
  return res;
}
