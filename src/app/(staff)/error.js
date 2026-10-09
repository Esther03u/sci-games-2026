'use client';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle } from '@/components/animate-ui/icons';

export default function StaffError({ error, reset }) {
  return (
    <div className="se-wrap">
      <GlassCard
        style={{
          textAlign: 'center',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className="se-icon">
          <AlertTriangle size={48} />
        </div>
        <h3 className="se-title">เกิดข้อผิดพลาดในการลงคะแนน</h3>
        <p className="se-text">{error?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}</p>
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
