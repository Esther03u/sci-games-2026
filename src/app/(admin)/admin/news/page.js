import NewsEditor from '@/components/admin/NewsEditor';
import { loadPage } from '@/lib/queries/page';
import { getAnnouncements, rows } from '@/lib/queries/core';
import { Megaphone } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'จัดการข่าวสาร - Admin',
  description: 'ระบบจัดการและเผยแพร่ข่าวประชาสัมพันธ์ Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const { announcements } = await loadPage(
    '/admin/news',
    async (sb) => ({ announcements: rows(await getAnnouncements(sb, { orderBy: 'created_at' })) }),
    { announcements: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Megaphone size={28} style={{ color: 'var(--gold-600)' }} /> จัดการข่าวสารและประกาศ
        </h1>
        <p className="page-subtitle">เผยแพร่ข่าวสาร ระเบียบการ และการประชาสัมพันธ์ให้ผู้เข้าชมเว็บไซต์</p>
      </div>

      <NewsEditor initialAnnouncements={announcements} />
    </div>
  );
}
