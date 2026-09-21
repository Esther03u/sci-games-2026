import MatchEditor from '@/components/admin/MatchEditor';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Trophy } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'จัดการการแข่งขัน - Admin',
  description: 'ระบบบันทึกผลและจัดการแมตช์การแข่งขัน Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  let matches = [];
  let sports = [];
  let teams = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [matchesRes, sportsRes, teamsRes] = await Promise.all([
      supabase.from('matches').select('*').order('match_date', { ascending: false }).order('match_time'),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('teams').select('*').order('sort_order'),
    ]);

    if (matchesRes.data) matches = matchesRes.data;
    if (sportsRes.data) sports = sportsRes.data;
    if (teamsRes.data) teams = teamsRes.data;
  } catch (err) {
    console.error('Error loading admin matches:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Trophy size={28} style={{ color: 'var(--gold-600)' }} /> จัดการและบันทึกผลการแข่งขัน
        </h1>
        <p className="page-subtitle">
          สร้างแมตช์ใหม่ อัปเดตผลคะแนนแบบเรียลไทม์ และเปลี่ยนสถานะการแข่งขัน
        </p>
      </div>

      <MatchEditor initialMatches={matches} sports={sports} teams={teams} />
    </div>
  );
}
