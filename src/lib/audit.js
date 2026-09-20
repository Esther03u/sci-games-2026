import { createAdminClient } from '@/lib/supabase/admin';

export async function createAuditLog({
  adminUserId,
  action,
  targetType,
  targetId,
  oldValues = null,
  newValues = null,
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('audit_logs').insert({
      admin_user_id: adminUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      old_values: oldValues,
      new_values: newValues,
    });

    if (error) {
      console.error('Audit log error:', error);
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
