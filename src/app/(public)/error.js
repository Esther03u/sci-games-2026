'use client';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle } from '@/components/animate-ui/icons';

export default function PublicError({ error, reset }) {
  return (
    <div className="pe-wrap">
      <GlassCard
        style={{
          maxWidth: '480px',
          textAlign: 'center',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className="pe-icon">
          <AlertTriangle size={52} />
        </div>
        <h2 className="pe-title">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
        <p className="pe-text">
          {error?.message || 'ระบบไม่สามารถเข้าถึงข้อมูลในขณะนี้ กรุณาลองใหม่อีกครั้ง'}
        </p>
        <button onClick={() => reset()} className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
          ลองใหม่อีกครั้ง
        </button>
      </GlassCard>
    </div>
  );
}
