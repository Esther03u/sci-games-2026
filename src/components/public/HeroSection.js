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
          <Trophy size={13} style={{ color: 'var(--accent-text)' }} />
          <span>9 - 11 ตุลาคม 2569</span>
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
      </div>
    </section>
  );
}
