import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/resolveActor';
import { createAuditLog } from '@/lib/audit';
import { badRequest } from '@/lib/api/scoring';

// Only these keys may be changed from the dashboard, with their validators.
const SETTINGS = {
  score_edit_window_minutes: (v) => Number.isInteger(v) && v >= 0 && v <= 1440,
  live_scoring_enabled: (v) => typeof v === 'boolean',
  podium_countdown: (v) => v && typeof v === 'object',
  // points for 1st→4th of every event (lib/placements), e.g. [10, 7, 5, 3]
  placement_points: (v) =>
    Array.isArray(v) &&
    v.length === 4 &&
    v.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1000),
  // home page "สาขาในแต่ละสี" — off until the department list is right
  show_departments_public: (v) => typeof v === 'boolean',
};

// GET /api/admin/settings
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('app_settings').select('key, value, updated_at');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/admin/settings  { key, value }
export async function PATCH(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || !SETTINGS[body.key]) return badRequest('ไม่รู้จักการตั้งค่านี้');
  if (!SETTINGS[body.key](body.value)) return badRequest('ค่าที่ตั้งไม่ถูกต้อง');

  const supabase = createAdminClient();
  const { data: old } = await supabase.from('app_settings').select('value').eq('key', body.key).maybeSingle();
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() })
    .select('key, value, updated_at')
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  await createAuditLog({
    adminUserId: guard.actor.adminUserId,
    action: 'update_setting',
    targetType: 'app_settings',
    targetId: '00000000-0000-0000-0000-000000000000',
    oldValues: { [body.key]: old?.value ?? null },
    newValues: { [body.key]: body.value },
  });

  // ISR pages that show these settings (podium reveal, placement points, departments)
  if (['podium_countdown', 'placement_points', 'show_departments_public'].includes(body.key)) {
    revalidatePath('/');
    revalidatePath('/results');
  }

  if (body.key === 'podium_countdown') {
    try {
      const channel = supabase.channel('podium-sync');
      await channel.send({
        type: 'broadcast',
        event: 'podium_update',
        payload: body.value,
      });
      await supabase.removeChannel(channel);
    } catch {
      // non-fatal, clients also poll
    }
  }

  return NextResponse.json({ success: true, data });
}
