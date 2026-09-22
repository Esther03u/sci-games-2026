'use client';
import Link from 'next/link';
import { Calendar, Trophy, Megaphone } from '@/components/animate-ui/icons';

export default function HeroSection() {
  return (
    <section className="hero-festival-wrapper">
      {/* Ambient Aura Background */}
      <div className="hero-festival-glow" />

      {/* Main Festival Hero Content */}
      <div className="hero-festival-content">
        {/* 1. Header Pill Badge */}
        <div className="hero-festival-badge">
          <span className="hero-badge-dot" />
          <Trophy size={14} style={{ color: 'var(--accent-text)' }} />
          <span>กีฬาสานสัมพันธ์ วท.มรภ.ภูเก็ต • 9 - 11 ตุลาคม 2569</span>
        </div>

        {/* 2. Main Title */}
        <h1 className="hero-festival-title">
          Sci Games <span className="hero-festival-accent">2026</span>
        </h1>

        {/* 3. Subtitle / Venue */}
        <p className="hero-festival-subtitle">
          รวมพลังความสามัคคี คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
          <br />
          <strong>ณ ศูนย์กีฬามหาวิทยาลัยราชภัฏภูเก็ต</strong>
        </p>

        {/* 4. Action Buttons (Side-by-Side on desktop, responsive) */}
        <div className="hero-festival-actions">
          <Link href="/schedule" className="btn-festival-primary">
            <Calendar size={18} />
            <span>ดูตารางการแข่งขัน</span>
          </Link>
          <Link href="/results" className="btn-festival-secondary">
            <Trophy size={18} />
            <span>สรุปผลการแข่งขัน</span>
          </Link>
          <Link href="/news" className="btn-festival-secondary">
            <Megaphone size={18} />
            <span>ข่าวประชาสัมพันธ์</span>
          </Link>
        </div>

        {/* 5. Tournament Stats Grid */}
        <div className="hero-stats-grid">
          <div className="hero-stat-card">
            <div className="hero-stat-teams-dots">
              <span style={{ background: '#ef4444' }} title="สีแดง" />
              <span style={{ background: '#3b82f6' }} title="สีฟ้า" />
              <span style={{ background: '#22c55e' }} title="สีเขียว" />
              <span style={{ background: '#a855f7' }} title="สีม่วง" />
            </div>
            <div className="hero-stat-label">4 สีสัมพันธ์</div>
            <div className="hero-stat-desc">แดง • ฟ้า • เขียว • ม่วง</div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-value">5</div>
            <div className="hero-stat-label">ชนิดกีฬา</div>
            <div className="hero-stat-desc">ฟุตซอล วอลเลย์ ตะกร้อ บาส เปตอง</div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-value">44</div>
            <div className="hero-stat-label">แมตช์การแข่งขัน</div>
            <div className="hero-stat-desc">ชิงชัยทุกรอบตลอดทัวร์นาเมนต์</div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-value">3 วัน</div>
            <div className="hero-stat-label">จัดเต็มความมันส์</div>
            <div className="hero-stat-desc">9 - 11 ตุลาคม 2569</div>
          </div>
        </div>
      </div>
    </section>
  );
}
