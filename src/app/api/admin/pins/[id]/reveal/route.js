import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/resolveActor';
import { createAuditLog } from '@/lib/audit';
import { badRequest, notFound, isUuid } from '@/lib/api/scoring';
import { rateLimit } from '@/lib/rate-limit';
import { decryptPin, isPinEncryptionConfigured } from '@/lib/auth/pinCrypto';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!isUuid(id)) return badRequest('id ไม่ถูกต้อง');

  // Rate limit: 20 reveals per 10 minutes per admin user
  const adminId = guard.actor.adminUserId || 'admin';
  const rl = await rateLimit({
    key: `reveal-pin:${adminId}`,
    limit: 20,
    windowMs: 600000,
  });
  if (!rl.success) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'RATE_LIMITED',
        message: 'เปิดดู PIN บ่อยเกินไป กรุณารอ 10 นาทีแล้วลองใหม่',
      },
      { status: 429 }
    );
  }

  if (!isPinEncryptionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'ENCRYPTION_KEY_MISSING',
        message: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า PIN_ENCRYPTION_KEY',
      },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  const { data: pinRow, error } = await supabase
    .from('sport_pins')
    .select('id, sport_id, label, pin_encrypted, sports(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  if (!pinRow) {
    return notFound('ไม่พบ PIN นี้');
  }

  if (!pinRow.pin_encrypted) {
    return badRequest('PIN นี้สร้างก่อนระบบดูซ้ำ หรือไม่มีข้อมูลเข้ารหัสที่สามารถถอดได้');
  }

  let plainPin;
  try {
    plainPin = decryptPin(pinRow.pin_encrypted);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error_code: 'DECRYPT_FAILED',
        message: `ไม่สามารถถอดรหัส PIN ได้ (${err.message})`,
      },
      { status: 500 }
    );
  }

  // Audit log: record who revealed the PIN and when (NEVER log the plain PIN)
  await createAuditLog({
    adminUserId: guard.actor.adminUserId,
    action: 'reveal_pin',
    targetType: 'sport_pins',
    targetId: pinRow.id,
    newValues: {
      sport_id: pinRow.sport_id,
      label: pinRow.label,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: pinRow.id,
        sport_id: pinRow.sport_id,
        label: pinRow.label,
        sportName: pinRow.sports?.name,
        pin: plainPin,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
