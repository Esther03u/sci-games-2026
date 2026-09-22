'use client';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import { Calendar, Medal, Megaphone } from '@/components/animate-ui/icons';

export default function QuickLinks() {
  const links = [
    {
      href: '/schedule',
      icon: <Calendar size={28} style={{ color: 'var(--text)' }} />,
      title: 'ตารางแข่งขัน',
      desc: 'เวลาและสนามแข่งขันทั้ง 3 วัน แยกตามชนิดกีฬา',
      tag: 'อัปเดตตลอดเวลา',
    },
    {
      href: '/results',
      icon: <Medal size={28} style={{ color: 'var(--accent-text)' }} />,
      title: 'ผลการแข่งขัน',
      desc: 'สรุปผลการแข่งขันแพ้ชนะทุกชนิดกีฬา',
      tag: 'สรุปผลล่าสุด',
    },
    {
      href: '/news',
      icon: <Megaphone size={28} style={{ color: 'var(--text)' }} />,
      title: 'ข่าวประชาสัมพันธ์',
      desc: 'ประกาศ กฎกติกา และระเบียบการแข่งขัน',
      tag: 'ประกาศสโมสร',
    },
  ];

  return (
    <section style={{ margin: '3.5rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text)' }}>
          บริการและข้อมูลการแข่งขัน
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '1rem' }}>
          เข้าถึงทุกข้อมูลสำคัญของงาน Sci Games 2026 ได้สะดวกรวดเร็ว
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {links.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <GlassCard
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                border: '1px solid var(--border)',
                background: '#ffffff',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--text-2)',
                      fontSize: '0.75rem',
                      border: '1px solid var(--border)',
                      fontWeight: 600,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    color: 'var(--text)',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: 'var(--text-2)',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
              <div
                style={{
                  marginTop: '1.25rem',
                  fontSize: '0.88rem',
                  color: 'var(--accent-text)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                ดูรายละเอียด <span>→</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
