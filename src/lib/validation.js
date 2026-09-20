import { createAdminClient } from '@/lib/supabase/admin';

export async function validateRegistration({
  student_id,
  full_name,
  department_id,
  sport_ids,
  phone,
}) {
  const supabase = createAdminClient();
  const errors = [];

  // 1. Student ID format check
  const cleanId = (student_id || '').trim();
  const isValidId = /^\d{2}-\d{4}-\d{5}$/.test(cleanId) || /^\d{11,13}$/.test(cleanId);
  if (!isValidId) {
    errors.push({
      code: 'INVALID_STUDENT_ID',
      message: 'รูปแบบรหัสนักศึกษาไม่ถูกต้อง (ตัวอย่าง: 66-1234-12345 หรือตัวเลข 11-13 หลัก)',
    });
    return { valid: false, errors };
  }

  // 2. Full Name
  if (!full_name || full_name.trim().length < 4) {
    errors.push({
      code: 'INVALID_NAME',
      message: 'กรุณากรอกชื่อและนามสกุลจริงให้ครบถ้วน',
    });
    return { valid: false, errors };
  }

  // 3. Phone format
  const cleanPhone = (phone || '').replace(/[-\s]/g, '');
  if (!/^0[0-9]{8,9}$/.test(cleanPhone)) {
    errors.push({
      code: 'INVALID_PHONE',
      message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678)',
    });
    return { valid: false, errors };
  }

  // 4. Duplicate athlete check
  const { data: existing } = await supabase
    .from('athletes')
    .select('id')
    .eq('student_id', cleanId)
    .maybeSingle();

  if (existing) {
    errors.push({
      code: 'DUPLICATE_REGISTRATION',
      message: 'รหัสนักศึกษานี้ได้ลงทะเบียนไว้แล้ว ไม่สามารถลงทะเบียนซ้ำได้',
    });
    return { valid: false, errors };
  }

  // 5. Department exists
  const { data: dept } = await supabase
    .from('departments')
    .select('id, team_id')
    .eq('id', department_id)
    .maybeSingle();

  if (!dept) {
    errors.push({
      code: 'INVALID_DEPARTMENT',
      message: 'ไม่พบสาขาวิชาที่เลือก กรุณาเลือกสาขาวิชาจากรายการ',
    });
    return { valid: false, errors };
  }

  // 6. Sport count (1-2 sports)
  if (!sport_ids || !Array.isArray(sport_ids) || sport_ids.length < 1 || sport_ids.length > 2) {
    errors.push({
      code: 'INVALID_SPORT_COUNT',
      message: 'สามารถเลือกสมัครกีฬาได้ 1 - 2 ชนิดเท่านั้น',
    });
    return { valid: false, errors };
  }

  // 7. Sports exist
  const { data: sports } = await supabase
    .from('sports')
    .select('id, name, max_players_per_team')
    .in('id', sport_ids);

  if (!sports || sports.length !== sport_ids.length) {
    errors.push({
      code: 'INVALID_SPORT',
      message: 'ชนิดกีฬาที่เลือกไม่ถูกต้องหรือไม่พบในระบบ',
    });
    return { valid: false, errors };
  }

  // 8. Quota check per sport per team
  for (const sport of sports) {
    if (sport.max_players_per_team) {
      // Find all athletes in this team
      const { data: teamAthletes } = await supabase
        .from('athletes')
        .select('id')
        .eq('team_id', dept.team_id);

      const athleteIds = teamAthletes?.map((a) => a.id) || [];

      if (athleteIds.length > 0) {
        const { count } = await supabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('sport_id', sport.id)
          .eq('status', 'registered')
          .in('athlete_id', athleteIds);

        if (count && count >= sport.max_players_per_team) {
          errors.push({
            code: 'QUOTA_FULL',
            message: `โควตากีฬา ${sport.name} ของสีนี้เต็มแล้ว (${count}/${sport.max_players_per_team} คน)`,
          });
          return { valid: false, errors };
        }
      }
    }
  }

  // 9. Schedule collision check (if 2 sports selected)
  if (sport_ids.length === 2) {
    const { data: schedules } = await supabase
      .from('sport_schedules')
      .select('*')
      .in('sport_id', sport_ids);

    const schedA = schedules?.filter((s) => s.sport_id === sport_ids[0]) || [];
    const schedB = schedules?.filter((s) => s.sport_id === sport_ids[1]) || [];

    for (const a of schedA) {
      for (const b of schedB) {
        if (a.schedule_date === b.schedule_date) {
          // Check overlap: startA < endB && startB < endA
          if (a.start_time < b.end_time && b.start_time < a.end_time) {
            const sportA = sports.find((s) => s.id === sport_ids[0]);
            const sportB = sports.find((s) => s.id === sport_ids[1]);
            errors.push({
              code: 'SCHEDULE_CONFLICT',
              message: `ตารางเวลาแข่งชนกัน: ${sportA?.name} (${a.schedule_date} ${a.start_time.slice(0, 5)}-${a.end_time.slice(0, 5)}) กับ ${sportB?.name} (${b.schedule_date} ${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)})`,
            });
            return { valid: false, errors };
          }
        }
      }
    }
  }

  return { valid: true, errors: [], teamId: dept.team_id };
}
