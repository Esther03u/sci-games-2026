'use client';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle } from '@/components/animate-ui/icons';

export default function AdminError({ error, reset }) {
  return (
    <div className="ae-wrap">
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
        <div className="ae-icon">
          <AlertTriangle size={52} />
        </div>
        <h2 className="ae-title">เกิดข้อผิดพลาดในการทำงานของระบบ Admin</h2>
        <p className="ae-text">
          {error?.message || 'ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้ กรุณาลองใหม่อีกครั้ง'}
        </p>
        <button onClick={() => reset()} className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
          ลองใหม่อีกครั้ง
        </button>
      </GlassCard>
    </div>
  );
}
