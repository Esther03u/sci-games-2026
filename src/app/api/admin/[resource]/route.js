import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/resolveActor';
import { createAuditLog } from '@/lib/audit';
import { RESOURCES, pickColumns } from '@/lib/api/adminResources';
import { badRequest, notFound, isUuid } from '@/lib/api/scoring';

// Generic admin CRUD for the dashboard's master-data tables.
//   POST   /api/admin/<resource>            { ...columns }        → created row
//   PATCH  /api/admin/<resource>            { id, ...columns }    → updated row
//   DELETE /api/admin/<resource>?id=<uuid>                        → { success }
// Resources and writable columns are whitelisted in lib/api/adminResources.js.
// Static siblings (/api/admin/users, pins, bracket, settings) take precedence.

const fail = (message, status = 500) => NextResponse.json({ success: false, message }, { status });
const revalidatePublic = (spec) => (spec.revalidate || []).forEach((p) => revalidatePath(p));

async function guard(params) {
  const { resource } = await params;
  const spec = RESOURCES[resource];
  if (!spec) return { response: notFound('ไม่รู้จักทรัพยากรนี้') };
  const g = await requireAdmin();
  if (g.response) return g;
  return { spec, resource, actor: g.actor };
}

export async function POST(request, { params }) {
  const g = await guard(params);
  if (g.response) return g.response;
  const { spec, resource, actor } = g;
  if (!spec.insert) return badRequest('ทรัพยากรนี้สร้างผ่านหน้านี้ไม่ได้');

  const body = await request.json().catch(() => null);
  if (!body) return badRequest('ข้อมูลไม่ถูกต้อง');
  const { values, error } = pickColumns(spec.insert, body, { requireAll: true });
  if (error) return badRequest(error);

  const row = { ...(spec.insert.defaults || {}), ...values };
  for (const [col, actorKey] of Object.entries(spec.insert.withActor || {})) row[col] = actor[actorKey];

  const sb = createAdminClient();
  const { data, error: dbErr } = await sb.from(spec.table).insert(row).select(spec.select).single();
  if (dbErr) return fail(dbErr.code === '23505' ? 'มีข้อมูลนี้อยู่แล้ว' : dbErr.message, dbErr.code === '23505' ? 409 : 500);

  await createAuditLog({ adminUserId: actor.adminUserId, action: `insert_${spec.table}`, targetType: spec.table, targetId: data.id, newValues: row });
  revalidatePublic(spec);
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request, { params }) {
  const g = await guard(params);
  if (g.response) return g.response;
  const { spec, actor } = g;
  if (!spec.update) return badRequest('ทรัพยากรนี้แก้ไขผ่านหน้านี้ไม่ได้');

  const body = await request.json().catch(() => null);
  if (!body || !isUuid(body.id)) return badRequest('id ไม่ถูกต้อง');
  const { id, ...rest } = body;
  const picked = pickColumns(spec.update, rest);
  if (picked.error) return badRequest(picked.error);
  const patch = spec.update.onUpdate ? spec.update.onUpdate(picked.values, actor) : picked.values;

  const sb = createAdminClient();
  const { data: before } = await sb.from(spec.table).select('*').eq('id', id).maybeSingle();
  if (!before) return notFound('ไม่พบข้อมูล');

  const { data, error: dbErr } = await sb.from(spec.table).update(patch).eq('id', id).select(spec.select).single();
  if (dbErr) return fail(dbErr.code === '23505' ? 'มีข้อมูลนี้อยู่แล้ว' : dbErr.message, dbErr.code === '23505' ? 409 : 500);

  const oldValues = Object.fromEntries(Object.keys(patch).map((k) => [k, before[k]]));
  await createAuditLog({ adminUserId: actor.adminUserId, action: `update_${spec.table}`, targetType: spec.table, targetId: id, oldValues, newValues: patch });
  revalidatePublic(spec);
  return NextResponse.json({ success: true, data });
}

export async function DELETE(request, { params }) {
  const g = await guard(params);
  if (g.response) return g.response;
  const { spec, actor } = g;
  if (!spec.delete) return badRequest('ทรัพยากรนี้ลบผ่านหน้านี้ไม่ได้');

  const id = new URL(request.url).searchParams.get('id');
  if (!isUuid(id)) return badRequest('id ไม่ถูกต้อง');

  const sb = createAdminClient();
  const { data: before } = await sb.from(spec.table).select('*').eq('id', id).maybeSingle();
  if (!before) return notFound('ไม่พบข้อมูล');

  const { error: dbErr } = await sb.from(spec.table).delete().eq('id', id);
  if (dbErr) return fail(dbErr.code === '23503' ? 'ลบไม่ได้ เพราะมีข้อมูลอื่นอ้างอิงอยู่' : dbErr.message, dbErr.code === '23503' ? 409 : 500);

  await createAuditLog({ adminUserId: actor.adminUserId, action: `delete_${spec.table}`, targetType: spec.table, targetId: id, oldValues: before });
  revalidatePublic(spec);
  return NextResponse.json({ success: true });
}
