import AthleteManager from '@/components/admin/AthleteManager';
import { loadPage } from '@/lib/queries/page';
import { getSports, getTeams, rows } from '@/lib/queries/core';

export const metadata = {
  title: 'จัดการนักกีฬา - Admin',
  description: 'ระบบจัดการรายชื่อและตรวจสอบนักกีฬา Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminAthletesPage() {
  const { athletes, teams, sports } = await loadPage(
    '/admin/athletes',
    async (sb) => {
      const [a, t, s] = await Promise.all([
        sb
          .from('athletes')
          .select('*, departments(name), teams(name, color_hex), registrations(*, sports(name))')
          .order('created_at', { ascending: false }),
        getTeams(sb),
        getSports(sb),
      ]);
      return { athletes: rows(a), teams: rows(t), sports: rows(s) };
    },
    { athletes: [], teams: [], sports: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">
          จัดการรายชื่อนักกีฬา
        </h1>
        <p className="page-subtitle">ตรวจสอบข้อมูลการสมัคร ยกเลิกการลงทะเบียน หรือค้นหานักศึกษา</p>
      </div>

      <AthleteManager initialAthletes={athletes} teams={teams} sports={sports} />
    </div>
  );
}
