import BracketBuilder from '@/components/admin/BracketBuilder';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Trophy } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'สายการแข่งขัน - Admin',
  description: 'สร้างสายแข่ง 4 ทีม (รองชนะเลิศ 2 คู่, ชิงที่ 3, ชิงชนะเลิศ) ที่เลื่อนผู้ชนะให้อัตโนมัติ',
};

export const dynamic = 'force-dynamic';

export default async function AdminBracketPage() {
  let sports = [];
  let teams = [];
  let matches = [];
  try {
    const supabase = await createServerSupabaseClient();
    const [sp, tm, mt] = await Promise.all([
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('teams').select('*').order('sort_order'),
      supabase.from('matches').select('*').not('round', 'is', null).order('match_date').order('match_time'),
    ]);
    sports = sp.data || [];
    teams = tm.data || [];
    matches = mt.data || [];
  } catch (err) {
    console.error('Error loading /admin/bracket:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Trophy size={26} style={{ color: 'var(--gold-600)' }} /> สายการแข่งขัน
        </h1>
        <p className="page-subtitle">สร้าง 4 แมตช์ต่อกีฬาในคลิกเดียว — ผู้ชนะรอบรองฯ ไปชิงชนะเลิศ ผู้แพ้ไปชิงที่ 3 อัตโนมัติเมื่อจบแมตช์</p>
      </div>
      <BracketBuilder sports={sports} teams={teams} initialMatches={matches} />
    </div>
  );
}
