'use client';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Users } from '@/components/animate-ui/icons';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '3rem 1.5rem 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Col 1: About */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <Trophy size={22} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                }}
              >
                Sci Games <span style={{ color: 'var(--accent-text)' }}>2026</span>
              </span>
            </div>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-2)',
                lineHeight: 1.6,
              }}
            >
              กีฬาสานสัมพันธ์ภายใน คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
              เสริมสร้างความสามัคคีและสุขภาพที่ดี
            </p>
          </div>

          {/* Col 2: Event Details */}
          <div>
            <h4
              style={{
                fontSize: '1rem',
                marginBottom: '0.75rem',
                color: 'var(--text)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              กำหนดการจัดงาน
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                fontSize: '0.88rem',
                color: 'var(--text-2)',
                lineHeight: 1.9,
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>วันที่:</strong> 9 - 11 ตุลาคม 2569
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MapPin size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>สถานที่:</strong> มหาวิทยาลัยราชภัฏภูเก็ต
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Users size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>ผู้เข้าร่วม:</strong> นักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4
              style={{
                fontSize: '1rem',
                marginBottom: '0.75rem',
                color: 'var(--text)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              เมนูลัด
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                fontSize: '0.88rem',
              }}
            >
              <Link href="/schedule" style={{ color: 'var(--text-2)' }}>
                ตารางแข่งขัน
              </Link>
              <Link href="/handbook" style={{ color: 'var(--text-2)' }}>
                สูจิบัตรและกำหนดการ
              </Link>
              <Link href="/results" style={{ color: 'var(--text-2)' }}>
                ผลการแข่งขัน
              </Link>
              <Link href="/news" style={{ color: 'var(--text-2)' }}>
                ข่าวประชาสัมพันธ์
              </Link>
              <Link href="/staff/login" style={{ color: 'var(--text-muted)' }}>
                เข้าสู่ระบบกรรมการ (ลงคะแนน)
              </Link>
              <Link href="/admin/login" style={{ color: 'var(--text-muted)' }}>
                เข้าสู่ระบบผู้ดูแล (Admin)
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--surface-2)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-3)',
          }}
        >
          <div>© 2569 สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต</div>
          <div>Sci Games Web Application</div>
        </div>
      </div>
    </footer>
  );
}
