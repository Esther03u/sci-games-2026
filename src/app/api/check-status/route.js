import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit({ key: `check:${ip}`, limit: 12, windowMs: 600000 });
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'RATE_LIMITED',
          message: 'คุณค้นหาบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.student_id || !body.phone) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_FIELDS',
          message: 'กรุณากรอกรหัสนักศึกษาและเบอร์โทรศัพท์ที่ใช้สมัคร',
        },
        { status: 400 }
      );
    }

    const cleanId = body.student_id.trim();
    const cleanPhone = body.phone.replace(/[-\s]/g, '');

    const supabase = createAdminClient();

    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id, student_id, full_name, created_at, departments(name), teams(name, color_hex, logo_emoji)')
      .eq('student_id', cleanId)
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (athleteError || !athlete) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'NOT_FOUND',
          message: 'ไม่พบข้อมูลการลงทะเบียน กรุณาตรวจสอบรหัสนักศึกษาและเบอร์โทรศัพท์ให้ถูกต้อง',
        },
        { status: 404 }
      );
    }

    const { data: registrations } = await supabase
      .from('registrations')
      .select('id, status, created_at, sports(name, sport_type)')
      .eq('athlete_id', athlete.id);

    return NextResponse.json({
      success: true,
      data: {
        student_id: athlete.student_id,
        full_name: athlete.full_name,
        department: athlete.departments?.name,
        team_name: athlete.teams?.name,
        team_color: athlete.teams?.color_hex,
        team_emoji: athlete.teams?.logo_emoji,
        registered_at: athlete.created_at,
        registrations:
          registrations?.map((r) => ({
            id: r.id,
            sport_name: r.sports?.name,
            sport_type: r.sports?.sport_type,
            status: r.status,
            created_at: r.created_at,
          })) || [],
      },
    });
  } catch (err) {
    console.error('Error in /api/check-status:', err);
    return NextResponse.json(
      {
        success: false,
        error_code: 'SERVER_ERROR',
        message: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้งในภายหลัง',
      },
      { status: 500 }
    );
  }
}
