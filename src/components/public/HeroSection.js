'use client';
import Link from 'next/link';
import { Pencil, Calendar } from '@/components/animate-ui/icons';

export default function HeroSection() {
  return (
    <section className="hero-aura-wrapper">
      <div className="hero-aura-glow" />

      {/* Screen 1 Inspired: Onboarding Rounded Card */}
      <div className="hero-card-white">
        <h1>
          Sci Games <span style={{ color: '#ca8a04' }}>2026</span>
        </h1>

        <p style={{ marginBottom: '2rem' }}>
          รวมพลังความสามัคคี คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
          <br />
          <strong style={{ color: '#09090b' }}>9 - 11 ตุลาคม 2569 ณ ศูนย์กีฬามหาวิทยาลัยราชภัฏภูเก็ต</strong>
        </p>

        {/* Action Buttons (Full-width / Large Pill Buttons like Screen 1) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <Link href="/register" className="btn-dark-pill">
            <Pencil size={18} />
            <span>สมัครกีฬา</span>
          </Link>
          <Link href="/schedule" className="btn-outline-pill" style={{ width: '100%' }}>
            <Calendar size={16} />
            <span>ตารางแข่ง</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
