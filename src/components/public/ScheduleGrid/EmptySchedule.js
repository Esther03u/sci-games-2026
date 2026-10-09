'use client';
import { Calendar } from '@/components/animate-ui/icons';

/** Nothing matches the filters. */
export default function EmptySchedule({ onReset }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        background: 'var(--surface)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
      }}
    >
      <Calendar size={48} style={{ color: 'var(--border-strong)', marginBottom: '0.75rem' }} />
      <h3
        style={{
          fontSize: '1.15rem',
          color: 'var(--text)',
          fontWeight: 700,
          marginBottom: '0.35rem',
        }}
      >
        ไม่พบรายการแข่งขันตามเงื่อนไขที่เลือก
      </h3>
      <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
        ลองเลือกทุกวัน หรือเลือกทุกชนิดกีฬาเพื่อดูโปรแกรมแข่งขันทั้งหมด
      </p>
      <button onClick={onReset} className="btn btn-secondary btn-sm">
        ล้างตัวกรองทั้งหมด
      </button>
    </div>
  );
}
