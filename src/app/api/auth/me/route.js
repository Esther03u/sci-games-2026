import { NextResponse } from 'next/server';
import { resolveActor, actorPublicView } from '@/lib/auth/resolveActor';

export const dynamic = 'force-dynamic';

// GET /api/auth/me — who am I (admin / staff / pin / null). Used by the staff UI.
export async function GET() {
  const actor = await resolveActor();
  return NextResponse.json({ success: true, data: actorPublicView(actor) });
}
