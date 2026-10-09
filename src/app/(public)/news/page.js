import GlassCard from '@/components/ui/GlassCard';
import { loadPublicPage } from '@/lib/queries/page';
import { getAnnouncements, rows } from '@/lib/queries/core';
import { formatDateTime } from '@/lib/format';
import { Clock, Pin } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'ข่าวประชาสัมพันธ์',
  description: 'ประกาศ กฎกติกา และระเบียบการแข่งขัน Sci Games 2026',
};

// ISR: cached and regenerated every 30 s; admin writes call revalidatePath()
// so edits show up right away. Only /live needs per-request rendering.
export const revalidate = 30;

export default async function NewsPage() {
  const { announcements } = await loadPublicPage(
    '/news',
    async (sb) => ({ announcements: rows(await getAnnouncements(sb)) }),
    { announcements: [] }
  );

  return (
    <div className="nw">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title">ข่าวสารและประกาศ</h1>
        <p className="page-subtitle">ข้อมูลข่าวสารทางการ ระเบียบการ และผลการจับสลากประกบคู่ Sci Games 2026</p>
      </div>

      {announcements.length === 0 && (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p className="nw-empty">ยังไม่มีประกาศในขณะนี้ — ติดตามข่าวสารจากสโมสรนักศึกษาได้ที่หน้านี้</p>
        </GlassCard>
      )}

      <div className="nw-list">
        {announcements.map((news) => (
          <GlassCard
            key={news.id}
            style={{
              padding: '1.75rem',
              border: news.is_pinned ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              background: news.is_pinned ? 'var(--accent-surface)' : 'var(--surface)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            <div
              className="flex-between"
              style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}
            >
              <span className="nw-date">
                <Clock size={13} /> เผยแพร่เมื่อ {formatDateTime(news.published_at)}
              </span>
              {news.is_pinned && (
                <span
                  className="badge"
                  style={{
                    background: 'var(--accent-surface)',
                    color: 'var(--accent-text)',
                    fontSize: '0.78rem',
                    border: '1px solid var(--accent-border)',
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

            <h2 className="nw-title">{news.title}</h2>

            <div className="nw-body">{news.content}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
