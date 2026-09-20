import NewsEditor from '@/components/admin/NewsEditor';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Megaphone } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'จัดการข่าวสาร - Admin',
  description: 'ระบบจัดการและเผยแพร่ข่าวประชาสัมพันธ์ Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  let announcements = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) announcements = data;
  } catch (err) {
    console.error('Error fetching admin news:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Megaphone size={28} style={{ color: '#fbbf24' }} /> จัดการข่าวสารและประกาศ
        </h1>
        <p className="page-subtitle">
          เผยแพร่ข่าวสาร ระเบียบการ และการประชาสัมพันธ์ให้ผู้เข้าชมเว็บไซต์
        </p>
      </div>

      <NewsEditor initialAnnouncements={announcements} />
    </div>
  );
}
