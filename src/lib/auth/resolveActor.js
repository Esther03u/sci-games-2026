import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PIN_COOKIE, readPinSession } from '@/lib/auth/pinSession';

/** @typedef {import('@/lib/types').Actor} Actor */

/**
 * Identify who is calling a Route Handler.
 *
 * Returns one of:
 *   { type: 'admin', adminUserId, authUserId, label, sportIds: '*' }
 *   { type: 'staff', adminUserId, authUserId, label, sportIds: [uuid, ...] }
 *   { type: 'pin',   pinId, sportIds: [uuid], label }
 *   null  — not signed in, or signed in but not in admin_users / PIN revoked
 *
 * Supabase session wins over a PIN cookie when both are present.
 *
 * @returns {Promise<Actor|null>}
 */
export async function resolveActor() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // RLS policy "self_read" lets a signed-in user read their own admin_users row.
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, display_name, role, staff_sport_assignments(sport_id)')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (adminUser) {
      if (adminUser.role === 'super_admin') {
        return {
          type: 'admin',
          adminUserId: adminUser.id,
          authUserId: user.id,
          label: adminUser.display_name,
          sportIds: '*',
        };
      }
      return {
        type: 'staff',
        adminUserId: adminUser.id,
        authUserId: user.id,
        label: adminUser.display_name,
        sportIds: (adminUser.staff_sport_assignments || []).map((a) => a.sport_id),
      };
    }
  }

  return resolvePinActor();
}

/** @returns {Promise<Actor|null>} */
async function resolvePinActor() {
  const cookieStore = await cookies();
  const session = await readPinSession(cookieStore.get(PIN_COOKIE)?.value);
  if (!session) return null;

  // Re-check the PIN row every request so an admin can revoke it instantly.
  try {
    const admin = createAdminClient();
    const { data: pin } = await admin
      .from('sport_pins')
      .select('id, sport_id, label, is_active, expires_at')
      .eq('id', session.pinId)
      .maybeSingle();

    if (!pin || !pin.is_active) return null;
    if (pin.expires_at && new Date(pin.expires_at) < new Date()) return null;
    if (pin.sport_id !== session.sportId) return null;

    return { type: 'pin', pinId: pin.id, sportIds: [pin.sport_id], label: pin.label };
  } catch (err) {
    console.error('resolvePinActor:', err);
    return null;
  }
}

export function actorCanScoreSport(actor, sportId) {
  if (!actor) return false;
  if (actor.sportIds === '*') return true;
  return Array.isArray(actor.sportIds) && actor.sportIds.includes(sportId);
}

// Shape passed as p_actor to the scoring functions in migration 002.
export function actorToRpc(actor) {
  return {
    type: actor.type,
    admin_user_id: actor.adminUserId || null,
    pin_id: actor.pinId || null,
    label: actor.label,
  };
}

// What the client is allowed to know about the current actor.
export function actorPublicView(actor) {
  if (!actor) return null;
  return {
    type: actor.type,
    label: actor.label,
    sportIds: actor.sportIds,
    adminUserId: actor.adminUserId || null,
  };
}

const unauthenticated = () =>
  NextResponse.json(
    { success: false, error_code: 'UNAUTHENTICATED', message: 'กรุณาเข้าสู่ระบบ' },
    { status: 401 }
  );

const forbidden = (message = 'คุณไม่มีสิทธิ์ทำรายการนี้') =>
  NextResponse.json({ success: false, error_code: 'FORBIDDEN', message }, { status: 403 });

/**
 * Guard for admin-only Route Handlers.
 * Returns { actor } on success, or { response } holding a 401/403 to return as-is.
 */
/**
 * Server-page guard for the live board (/live). Spectators are not meant to
 * see live scores (decision 2026-09-22), so a Supabase session that belongs
 * to admin_users is required: since migration 007 only those accounts may
 * read live scores at all. Referees on a PIN are `anon` to Supabase — their
 * screen is /staff/scoring, which is served by the service role.
 */
export async function requireViewer(next = '/live') {
  const actor = await resolveActor();
  if (!actor) redirect(`/staff/login?next=${encodeURIComponent(next)}`);
  if (actor.type === 'pin') redirect('/staff/scoring');
  return actor;
}

export async function requireAdmin() {
  const actor = await resolveActor();
  if (!actor) return { response: unauthenticated() };
  if (actor.type !== 'admin') return { response: forbidden('เฉพาะผู้ดูแลระบบเท่านั้น') };
  return { actor };
}

/** Guard for anyone who can score (admin, staff, PIN). */
export async function requireScorer() {
  const actor = await resolveActor();
  if (!actor) return { response: unauthenticated() };
  return { actor };
}

/** Guard for scoring a specific sport. */
export async function requireScorerForSport(sportId) {
  const actor = await resolveActor();
  if (!actor) return { response: unauthenticated() };
  if (!actorCanScoreSport(actor, sportId)) {
    return { response: forbidden('คุณไม่ได้รับมอบหมายให้ลงคะแนนกีฬานี้') };
  }
  return { actor };
}
