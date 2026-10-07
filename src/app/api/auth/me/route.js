import { NextResponse } from 'next/server';
import { resolveActorWithStatus, actorPublicView } from '@/lib/auth/resolveActor';

export const dynamic = 'force-dynamic';

// GET /api/auth/me — who am I (admin / staff / pin / null). Used by the staff UI.
export async function GET() {
  const { actor, kicked } = await resolveActorWithStatus();
  return NextResponse.json({
    success: true,
    data: actorPublicView(actor),
    kicked: Boolean(kicked),
  });
}
