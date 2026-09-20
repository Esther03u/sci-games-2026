import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Identify who is calling a Route Handler.
 *
 * Returns one of:
 *   { type: 'admin', adminUserId, authUserId, label, sportIds: '*' }
 *   { type: 'staff', adminUserId, authUserId, label, sportIds: [uuid, ...] }
 *   null  — not signed in, or signed in but not in admin_users
 *
 * PIN-based actors ({ type: 'pin' }) are added in Phase 1.
 */
export async function resolveActor() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS policy "self_read" lets a signed-in user read their own admin_users row.
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, display_name, role, staff_sport_assignments(sport_id)')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!adminUser) return null;

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

export function actorCanScoreSport(actor, sportId) {
  if (!actor) return false;
  if (actor.sportIds === '*') return true;
  return Array.isArray(actor.sportIds) && actor.sportIds.includes(sportId);
}

/**
 * Guard for admin-only Route Handlers.
 * Returns { actor } on success, or { response } holding a 401/403 to return as-is.
 */
export async function requireAdmin() {
  const actor = await resolveActor();
  if (!actor) {
    return {
      response: NextResponse.json(
        { success: false, error_code: 'UNAUTHENTICATED', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      ),
    };
  }
  if (actor.type !== 'admin') {
    return {
      response: NextResponse.json(
        { success: false, error_code: 'FORBIDDEN', message: 'เฉพาะผู้ดูแลระบบเท่านั้น' },
        { status: 403 }
      ),
    };
  }
  return { actor };
}
