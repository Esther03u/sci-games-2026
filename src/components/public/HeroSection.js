'use client';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="hero-festival-wrapper">
      {/* Ambient Aura Background */}
      <div className="hero-festival-glow" />

      {/* Main Festival Hero Content */}
      <div className="hero-festival-content">
        {/* 1. Header Pill Badge */}
        <div className="hero-festival-badge">
          <span>9 – 11 ตุลาคม 2569</span>
        </div>

        {/* 2. Main Title */}
        <h1 className="hero-festival-title">
          Sci Games <span className="hero-festival-accent">2026</span>
        </h1>

        {/* 3. Subtitle / Venue */}
        <p className="hero-festival-subtitle">
          <span>รวมพลังความสามัคคี คณะวิทยาศาสตร์และเทคโนโลยี</span>
          <span className="hero-festival-venue">ณ มหาวิทยาลัยราชภัฏภูเก็ต</span>
        </p>

        {/* 4. Action Buttons */}
        <div className="hero-festival-actions">
          <Link href="/schedule" className="btn-festival-primary">
            <span>ดูตารางการแข่งขัน</span>
          </Link>
          <div className="hero-festival-secondary-group">
            <Link href="/results" className="btn-festival-secondary">
              <span>สรุปผลการแข่งขัน</span>
            </Link>
            <Link href="/handbook" className="btn-festival-secondary">
              <span>สูจิบัตร</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
