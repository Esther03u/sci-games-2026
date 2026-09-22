import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateRegistration } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { mapRegisterError } from '@/lib/api/register';

export async function POST(request) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(request);
    const rl = await rateLimit({ key: `register:${ip}`, limit: 8, windowMs: 600000 });
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'RATE_LIMITED',
          message: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error_code: 'INVALID_BODY', message: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { student_id, full_name, department_id, sport_ids, phone } = body;

    // 2. Server-side validation
    const result = await validateRegistration({
      student_id,
      full_name,
      department_id,
      sport_ids,
      phone,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error_code: result.errors[0]?.code || 'VALIDATION_FAILED',
          message: result.errors[0]?.message || 'ข้อมูลการสมัครไม่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    // 3. Atomic insert: duplicate check, per-team quota and both rows in one
    //    transaction (register_athlete, migration 006) — no race between
    //    concurrent submissions.
    const supabase = createAdminClient();
    const { data: created, error: rpcError } = await supabase.rpc('register_athlete', {
      p_student_id: student_id.trim(),
      p_full_name: full_name.trim(),
      p_department_id: department_id,
      p_phone: phone.replace(/[-\s]/g, ''),
      p_sport_ids: sport_ids,
    });

    if (rpcError) {
      const mapped = mapRegisterError(rpcError);
      if (mapped.status === 500) console.error('register_athlete error:', rpcError);
      return NextResponse.json(mapped.body, { status: mapped.status });
    }

    const { data: athlete } = await supabase
      .from('athletes')
      .select('full_name, student_id, departments(name), teams(name, color_hex, logo_emoji)')
      .eq('id', created.athlete_id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        athlete_name: athlete?.full_name ?? created.full_name,
        student_id: athlete?.student_id ?? created.student_id,
        team_name: athlete?.teams?.name,
        team_color: athlete?.teams?.color_hex,
        team_emoji: athlete?.teams?.logo_emoji,
        department: athlete?.departments?.name,
      },
    });
  } catch (err) {
    console.error('Unexpected error in /api/register:', err);
    return NextResponse.json(
      {
        success: false,
        error_code: 'UNEXPECTED_ERROR',
        message: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้งในภายหลัง',
      },
      { status: 500 }
    );
  }
}
