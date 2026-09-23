import SportScheduleManager from '@/components/admin/SportScheduleManager';
import { loadPage } from '@/lib/queries/page';
import { getSports, rows } from '@/lib/queries/core';

export const metadata = {
  title: 'กำหนดช่วงเวลาแข่งขัน - Admin',
  description: 'กำหนดตารางเวลาการแข่งขันแต่ละชนิดกีฬาเพื่อใช้ตรวจสอบตารางชน',
};

export const dynamic = 'force-dynamic';

export default async function AdminSportSchedulesPage() {
  const { schedules, sports } = await loadPage(
    '/admin/sport-schedules',
    async (sb) => {
      const [sc, sp] = await Promise.all([
        sb.from('sport_schedules').select('*, sports(name)').order('schedule_date').order('start_time'),
        getSports(sb),
      ]);
      return { schedules: rows(sc), sports: rows(sp) };
    },
    { schedules: [], sports: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">
          กำหนดการและช่วงเวลาแข่งขัน
        </h1>
        <p className="page-subtitle">
          ช่วงเวลาสำหรับแต่ละชนิดกีฬา (ใช้สำหรับระบบเช็คตารางแข่งชนตอนนักศึกษาสมัคร)
        </p>
      </div>

      <SportScheduleManager initialSchedules={schedules} sports={sports} />
    </div>
  );
}
