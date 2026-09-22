'use client';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle } from '@/components/animate-ui/icons';

export default function StaffError({ error, reset }) {
  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto', padding: '1rem' }}>
      <GlassCard
        style={{
          textAlign: 'center',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ marginBottom: '1rem', color: '#f59e0b' }}>
          <AlertTriangle size={48} />
        </div>
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
          เกิดข้อผิดพลาดในการลงคะแนน
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          {error?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}
        </p>
        <button
          onClick={() => reset()}
          className="btn btn-primary btn-sm"
          style={{ padding: '0.6rem 1.5rem' }}
        >
          ลองใหม่อีกครั้ง
        </button>
      </GlassCard>
    </div>
  );
}
