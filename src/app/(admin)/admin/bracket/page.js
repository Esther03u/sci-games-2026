import BracketBuilder from '@/components/admin/BracketBuilder';
import { loadPage } from '@/lib/queries/page';
import { loadBracketPage } from '@/lib/queries/admin';
import { Trophy } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'สายการแข่งขัน - Admin',
  description: 'สร้างสายแข่ง 4 ทีม (รองชนะเลิศ 2 คู่, ชิงที่ 3, ชิงชนะเลิศ) ที่เลื่อนผู้ชนะให้อัตโนมัติ',
};

export const dynamic = 'force-dynamic';

export default async function AdminBracketPage() {
  const { sports, teams, matches } = await loadPage('/admin/bracket', loadBracketPage, { sports: [], teams: [], matches: [] });

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
