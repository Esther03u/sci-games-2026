'use client';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle } from '@/components/animate-ui/icons';

export default function PublicError({ error, reset }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <GlassCard style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '1rem', color: '#f59e0b' }}>
          <AlertTriangle size={52} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: '#09090b' }}>
          เกิดข้อผิดพลาดในการโหลดข้อมูล
        </h2>
        <p style={{ color: '#52525b', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {error?.message || 'ระบบไม่สามารถเข้าถึงข้อมูลในขณะนี้ กรุณาลองใหม่อีกครั้ง'}
        </p>
        <button
          onClick={() => reset()}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.75rem' }}
        >
          ลองใหม่อีกครั้ง
        </button>
      </GlassCard>
    </div>
  );
}
