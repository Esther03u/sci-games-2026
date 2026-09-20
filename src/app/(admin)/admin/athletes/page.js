import AthleteManager from '@/components/admin/AthleteManager';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Users } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'จัดการนักกีฬา - Admin',
  description: 'ระบบจัดการรายชื่อและตรวจสอบนักกีฬา Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminAthletesPage() {
  let athletes = [];
  let teams = [];
  let sports = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [athletesRes, teamsRes, sportsRes] = await Promise.all([
      supabase
        .from('athletes')
        .select('*, departments(name), teams(name, color_hex), registrations(*, sports(name))')
        .order('created_at', { ascending: false }),
      supabase.from('teams').select('*').order('sort_order'),
      supabase.from('sports').select('*').order('sort_order'),
    ]);

    if (athletesRes.data) athletes = athletesRes.data;
    if (teamsRes.data) teams = teamsRes.data;
    if (sportsRes.data) sports = sportsRes.data;
  } catch (err) {
    console.error('Error fetching admin athletes:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={28} style={{ color: '#fbbf24' }} /> จัดการรายชื่อนักกีฬา
        </h1>
        <p className="page-subtitle">
          ตรวจสอบข้อมูลการสมัคร ยกเลิกการลงทะเบียน หรือค้นหานักศึกษา
        </p>
      </div>

      <AthleteManager
        initialAthletes={athletes}
        teams={teams}
        sports={sports}
      />
    </div>
  );
}
