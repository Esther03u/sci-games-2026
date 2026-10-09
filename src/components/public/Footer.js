'use client';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Users } from '@/components/animate-ui/icons';

export default function Footer() {
  return (
    <footer className="ft">
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div className="footer-grid">
          {/* Col 1: About */}
          <div>
            <div className="ft-brand">
              <Trophy size={22} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
              <span className="ft-brand-name">
                Sci Games <span className="brand-accent">2026</span>
              </span>
            </div>
            <p className="ft-about">
              กีฬาสานสัมพันธ์ภายใน คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
              เสริมสร้างความสามัคคีและสุขภาพที่ดี
            </p>
          </div>

          {/* Col 2: Event Details */}
          <div>
            <h4 className="ft-heading">กำหนดการจัดงาน</h4>
            <ul className="ft-list">
              <li className="ft-list-item">
                <Calendar size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>วันที่:</strong> 8 - 11 ตุลาคม 2569
                </span>
              </li>
              <li className="ft-list-item">
                <MapPin size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>สถานที่:</strong> มหาวิทยาลัยราชภัฏภูเก็ต
                </span>
              </li>
              <li className="ft-list-item">
                <Users size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>ผู้เข้าร่วม:</strong> นักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="ft-heading">เมนูลัด</h4>
            <div className="footer-links" style={{ fontSize: '0.88rem' }}>
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
        <div className="ft-bottom">
          <div>© 2569 สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต</div>
          <div>Sci Games Web Application</div>
        </div>
      </div>
    </footer>
  );
}
