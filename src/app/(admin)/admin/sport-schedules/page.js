import SportScheduleManager from '@/components/admin/SportScheduleManager';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Clock } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'กำหนดช่วงเวลาแข่งขัน - Admin',
  description: 'กำหนดตารางเวลาการแข่งขันแต่ละชนิดกีฬาเพื่อใช้ตรวจสอบตารางชน',
};

export const dynamic = 'force-dynamic';

export default async function AdminSportSchedulesPage() {
  let schedules = [];
  let sports = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [schedRes, sportsRes] = await Promise.all([
      supabase
        .from('sport_schedules')
        .select('*, sports(name)')
        .order('schedule_date')
        .order('start_time'),
      supabase.from('sports').select('*').order('sort_order'),
    ]);

    if (schedRes.data) schedules = schedRes.data;
    if (sportsRes.data) sports = sportsRes.data;
  } catch (err) {
    console.error('Error fetching sport schedules:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={28} style={{ color: '#fbbf24' }} /> กำหนดการและช่วงเวลาแข่งขัน
        </h1>
        <p className="page-subtitle">
          ช่วงเวลาสำหรับแต่ละชนิดกีฬา (ใช้สำหรับระบบเช็คตารางแข่งชนตอนนักศึกษาสมัคร)
        </p>
      </div>

      <SportScheduleManager initialSchedules={schedules} sports={sports} />
    </div>
  );
}
