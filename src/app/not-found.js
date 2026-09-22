import Link from 'next/link';
import { Trophy } from '@/components/animate-ui/icons';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="glass-card no-hover animate-fade-in"
        style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{ marginBottom: '1rem', color: 'var(--accent)' }}>
          <Trophy size={64} animateOnHover />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '4rem',
            fontWeight: 900,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            marginBottom: '1.5rem',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          ไม่พบหน้าที่คุณต้องการ
        </p>
        <Link href="/" className="btn btn-primary btn-lg">
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
