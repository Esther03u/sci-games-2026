'use client';
import Link from 'next/link';
import { Calendar, Trophy, Megaphone, MapPin } from '@/components/animate-ui/icons';

export default function HeroSection() {
  return (
    <section className="hero-festival-wrapper">
      {/* Ambient Aura Background */}
      <div className="hero-festival-glow" />

      {/* Main Festival Hero Content */}
      <div className="hero-festival-content">
        {/* 1. Header Pill Badge */}
        <div className="hero-festival-badge">
          <span className="hero-badge-pulse" />
          <Trophy size={13} className="hero-badge-icon" />
          <span>9 – 11 ตุลาคม 2569</span>
        </div>

        {/* 2. Main Title */}
        <h1 className="hero-festival-title">
          Sci Games <span className="hero-festival-accent">2026</span>
        </h1>

        {/* 3. Subtitle / Venue */}
        <p className="hero-festival-subtitle">
          <span>รวมพลังความสามัคคี คณะวิทยาศาสตร์และเทคโนโลยี</span>
          <span className="hero-festival-venue">
            <MapPin size={13} /> ณ ศูนย์กีฬามหาวิทยาลัยราชภัฏภูเก็ต
          </span>
        </p>

        {/* 4. Action Buttons */}
        <div className="hero-festival-actions">
          <Link href="/schedule" className="btn-festival-primary">
            <Calendar size={17} />
            <span>ดูตารางการแข่งขัน</span>
          </Link>
          <div className="hero-festival-secondary-group">
            <Link href="/results" className="btn-festival-secondary">
              <Trophy size={15} />
              <span>สรุปผลการแข่งขัน</span>
            </Link>
            <Link href="/news" className="btn-festival-secondary">
              <Megaphone size={15} />
              <span>ข่าวประชาสัมพันธ์</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
