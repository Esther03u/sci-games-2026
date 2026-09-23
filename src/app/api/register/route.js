import { NextResponse } from 'next/server';

// Web registration is closed for Sci Games 2026 (decision 24 ก.ย.): athletes
// are registered by the faculty offline, and /register redirects to
// /schedule. The page was gone but this endpoint still inserted athletes for
// anyone who POSTed to it, so it now refuses every request.
// The full handler (validation + register_athlete RPC, migration 006) is in
// git history before this change if registration ever reopens.
export function POST() {
  return NextResponse.json(
    { success: false, error_code: 'REGISTRATION_CLOSED', message: 'ปิดรับสมัครผ่านเว็บไซต์แล้ว' },
    { status: 410 }
  );
}
