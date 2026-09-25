import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/resolveActor';
import { createAuditLog } from '@/lib/audit';

// GET /api/admin/backup
// Exports all critical tables as a single JSON payload.
// Only super_admin may call this endpoint.

const TABLES = [
  { name: 'teams', select: '*', orderBy: 'name' },
  { name: 'sports', select: '*', orderBy: 'name' },
  { name: 'departments', select: '*', orderBy: 'name' },
  { name: 'athletes', select: '*', orderBy: 'full_name' },
  { name: 'registrations', select: '*', orderBy: 'created_at' },
  { name: 'matches', select: '*', orderBy: 'match_date' },
  { name: 'score_events', select: '*', orderBy: 'created_at' },
  { name: 'announcements', select: '*', orderBy: 'created_at' },
  { name: 'sport_schedules', select: '*', orderBy: 'schedule_date' },
  {
    name: 'sport_pins',
    select: 'id, sport_id, label, is_active, expires_at, created_at',
    orderBy: 'created_at',
  },
  { name: 'admin_users', select: 'id, auth_user_id, display_name, role, created_at', orderBy: 'created_at' },
  { name: 'app_settings', select: '*', orderBy: 'key' },
  { name: 'audit_logs', select: '*', orderBy: 'created_at' },
];

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const sb = createAdminClient();
  const backup = {
    meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: guard.actor.label,
      tables: [],
    },
    data: {},
  };

  const errors = [];

  for (const t of TABLES) {
    try {
      let query = sb.from(t.name).select(t.select);
      if (t.orderBy) query = query.order(t.orderBy, { ascending: true });
      // Supabase default limit is 1000; for large tables paginate
      const allRows = [];
      let from = 0;
      const PAGE = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await query.range(from, from + PAGE - 1);
        if (error) {
          errors.push({ table: t.name, error: error.message });
          hasMore = false;
        } else {
          allRows.push(...data);
          hasMore = data.length === PAGE;
          from += PAGE;
        }
        // Re-create query for next page (supabase-js quirk with range)
        if (hasMore) {
          query = sb.from(t.name).select(t.select);
          if (t.orderBy) query = query.order(t.orderBy, { ascending: true });
        }
      }
      backup.data[t.name] = allRows;
      backup.meta.tables.push({ name: t.name, count: allRows.length });
    } catch (err) {
      errors.push({ table: t.name, error: err.message });
      backup.data[t.name] = [];
      backup.meta.tables.push({ name: t.name, count: 0, error: err.message });
    }
  }

  if (errors.length > 0) {
    backup.meta.errors = errors;
  }

  // Log the backup action
  await createAuditLog({
    adminUserId: guard.actor.adminUserId,
    action: 'export_backup',
    targetType: 'system',
    targetId: '00000000-0000-0000-0000-000000000000',
    newValues: {
      tables_exported: backup.meta.tables.map((t) => t.name),
      total_rows: backup.meta.tables.reduce((sum, t) => sum + t.count, 0),
    },
  });

  // Return as downloadable JSON
  const json = JSON.stringify(backup, null, 2);
  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="sci-games-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
