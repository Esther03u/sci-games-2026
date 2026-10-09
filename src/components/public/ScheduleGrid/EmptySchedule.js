'use client';
import { Calendar } from '@/components/animate-ui/icons';

/** Nothing matches the filters. */
export default function EmptySchedule({ onReset }) {
  return (
    <div className="sg-empty">
      <Calendar size={48} style={{ color: 'var(--border-strong)', marginBottom: '0.75rem' }} />
      <h3 className="sg-empty-title">ไม่พบรายการแข่งขันตามเงื่อนไขที่เลือก</h3>
      <p className="sg-empty-text">ลองเลือกทุกวัน หรือเลือกทุกชนิดกีฬาเพื่อดูโปรแกรมแข่งขันทั้งหมด</p>
      <button onClick={onReset} className="btn btn-secondary btn-sm">
        ล้างตัวกรองทั้งหมด
      </button>
    </div>
  );
}
