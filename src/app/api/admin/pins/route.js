import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/resolveActor';
import { createAuditLog } from '@/lib/audit';
import { badRequest, notFound, isUuid } from '@/lib/api/scoring';
import { encryptPin } from '@/lib/auth/pinCrypto';

const PIN_SELECT =
  'id, sport_id, label, is_active, expires_at, last_used_at, created_at, pin_encrypted, sports(name)';

function sanitizePinRow(row) {
  if (!row) return null;
  const { pin_encrypted, ...rest } = row;
  return {
    ...rest,
    can_reveal: Boolean(pin_encrypted),
  };
}

// GET /api/admin/pins — list (never returns hashes or encrypted secrets)
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sport_pins')
    .select(PIN_SELECT)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: (data || []).map(sanitizePinRow) });
}

// POST /api/admin/pins  { sport_id, label, expires_at? }
// Generates a random 6-digit PIN. The plain PIN is returned ONCE in this response.
export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || !isUuid(body.sport_id)) return badRequest('กรุณาเลือกกีฬา');
  const label = String(body.label || '').trim();
  if (!label) return badRequest('กรุณาตั้งชื่อ PIN เช่น "กรรมการฟุตซอล สนาม 1"');

  let expiresAt = null;
  if (body.expires_at) {
    const d = new Date(body.expires_at);
    if (Number.isNaN(d.getTime())) return badRequest('วันหมดอายุไม่ถูกต้อง');
    expiresAt = d.toISOString();
  }

  const pin = String(randomInt(0, 1000000)).padStart(6, '0');
  const pinHash = await bcrypt.hash(pin, 10);
  const pinEncrypted = encryptPin(pin);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sport_pins')
    .insert({
      sport_id: body.sport_id,
      label,
      pin_hash: pinHash,
      pin_encrypted: pinEncrypted,
      expires_at: expiresAt,
      created_by: guard.actor.adminUserId,
    })
    .select(PIN_SELECT)
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  await createAuditLog({
    adminUserId: guard.actor.adminUserId,
    action: 'create_pin',
    targetType: 'sport_pins',
    targetId: data.id,
    newValues: { sport_id: data.sport_id, label, expires_at: expiresAt },
  });

  return NextResponse.json({ success: true, data: { ...sanitizePinRow(data), pin } });
}

// PATCH /api/admin/pins  { id, is_active?, label?, expires_at? }
export async function PATCH(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || !isUuid(body.id)) return badRequest('id ไม่ถูกต้อง');

  const patch = {};
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
  if (typeof body.label === 'string' && body.label.trim()) patch.label = body.label.trim();
  if (body.expires_at === null) patch.expires_at = null;
  else if (body.expires_at) {
    const d = new Date(body.expires_at);
    if (Number.isNaN(d.getTime())) return badRequest('วันหมดอายุไม่ถูกต้อง');
    patch.expires_at = d.toISOString();
  }
  if (Object.keys(patch).length === 0) return badRequest('ไม่มีข้อมูลให้แก้ไข');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sport_pins')
    .update(patch)
    .eq('id', body.id)
    .select(PIN_SELECT)
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  if (!data) return notFound('ไม่พบ PIN นี้');

  await createAuditLog({
    adminUserId: guard.actor.adminUserId,
    action: 'update_pin',
    targetType: 'sport_pins',
    targetId: body.id,
    newValues: patch,
  });

  return NextResponse.json({ success: true, data: sanitizePinRow(data) });
}

// DELETE /api/admin/pins?id=...
export async function DELETE(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!isUuid(id)) return badRequest('id ไม่ถูกต้อง');

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('sport_pins')
    .select('id, label, sport_id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return notFound('ไม่พบ PIN นี้');

  const { error } = await supabase.from('sport_pins').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  await createAuditLog({
    adminUserId: guard.actor.adminUserId,
    action: 'delete_pin',
    targetType: 'sport_pins',
    targetId: id,
    oldValues: existing,
  });

  return NextResponse.json({ success: true });
}
