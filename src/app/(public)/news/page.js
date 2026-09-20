import GlassCard from '@/components/ui/GlassCard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils';
import { Megaphone, Clock, Pin } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'ข่าวประชาสัมพันธ์',
  description: 'ประกาศ กฎกติกา และระเบียบการแข่งขัน Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  let announcements = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });

    if (data) announcements = data;
  } catch (err) {
    console.error('Error fetching announcements:', err);
  }

  // Fallback announcements if DB is empty
  if (announcements.length === 0) {
    announcements = [
      {
        id: '1',
        title: 'เปิดรับสมัครกีฬาตัวแทน 4 สี Sci Games 2569 อย่างเป็นทางการ',
        content:
          'สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี ขอเชิญชวนนักศึกษาทุกชั้นปีสมัครกีฬาเข้าร่วมการแข่งขัน 6 รายการ ได้ตั้งแต่วันนี้เป็นต้นไปผ่านระบบออนไลน์',
        is_pinned: true,
        published_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'ระเบียบการแข่งขันและข้อปฏิบัติสำหรับนักกีฬา',
        content:
          'ขอให้นักกีฬาทุกท่านตรวจสอบเวลาและสถานที่แข่งขันให้ตรงกับตารางเวลาที่กำหนด พร้อมทั้งนำบัตรประจำตัวนักศึกษามาแสดงก่อนเริ่มการแข่งขันทุกคู่',
        is_pinned: false,
        published_at: new Date().toISOString(),
      },
    ];
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <Megaphone size={30} style={{ color: '#ca8a04' }} /> ข่าวสารและประกาศ
        </h1>
        <p className="page-subtitle">
          ข้อมูลข่าวสารทางการ ระเบียบการ และผลการจับสลากประกบคู่ Sci Games 2026
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {announcements.map((news) => (
          <GlassCard
            key={news.id}
            style={{
              padding: '1.75rem',
              border: news.is_pinned
                ? '1px solid #fde68a'
                : '1px solid #e4e4e7',
              background: news.is_pinned
                ? '#fefce8'
                : '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              className="flex-between"
              style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: '#71717a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Clock size={13} /> เผยแพร่เมื่อ {formatDateTime(news.published_at)}
              </span>
              {news.is_pinned && (
                <span
                  className="badge"
                  style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    fontSize: '0.78rem',
                    border: '1px solid #fde68a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 600,
                  }}
                >
                  <Pin size={12} /> ประกาศสำคัญ (ปักหมุด)
                </span>
              )}
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#09090b',
                marginBottom: '0.85rem',
                lineHeight: 1.35,
              }}
            >
              {news.title}
            </h2>

            <div
              style={{
                fontSize: '0.96rem',
                color: '#52525b',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}
            >
              {news.content}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
