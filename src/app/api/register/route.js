import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateRegistration } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rl = rateLimit({ key: `register:${ip}`, limit: 8, windowMs: 600000 });
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

    const supabase = createAdminClient();

    // 3. Insert athlete
    const cleanStudentId = student_id.trim();
    const cleanPhone = phone.replace(/[-\s]/g, '');

    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .insert({
        student_id: cleanStudentId,
        full_name: full_name.trim(),
        department_id,
        team_id: result.teamId,
        phone: cleanPhone,
      })
      .select('*, departments(name), teams(name, color_hex, logo_emoji)')
      .single();

    if (athleteError) {
      if (athleteError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error_code: 'DUPLICATE_REGISTRATION',
            message: 'รหัสนักศึกษานี้ได้ลงทะเบียนไว้แล้ว',
          },
          { status: 409 }
        );
      }
      console.error('Athlete insert error:', athleteError);
      return NextResponse.json(
        {
          success: false,
          error_code: 'SERVER_ERROR',
          message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลนักกีฬา',
        },
        { status: 500 }
      );
    }

    // 4. Insert registrations
    const registrations = sport_ids.map((sid) => ({
      athlete_id: athlete.id,
      sport_id: sid,
      status: 'registered',
    }));

    const { error: regError } = await supabase
      .from('registrations')
      .insert(registrations);

    if (regError) {
      console.error('Registration link error:', regError);
      // Rollback athlete record to prevent orphaned records
      await supabase.from('athletes').delete().eq('id', athlete.id);

      return NextResponse.json(
        {
          success: false,
          error_code: 'SERVER_ERROR',
          message: 'เกิดข้อผิดพลาดในการบันทึกชนิดกีฬาที่สมัคร กรุณาลองใหม่อีกครั้ง',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        athlete_name: athlete.full_name,
        student_id: athlete.student_id,
        team_name: athlete.teams?.name,
        team_color: athlete.teams?.color_hex,
        team_emoji: athlete.teams?.logo_emoji,
        department: athlete.departments?.name,
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
