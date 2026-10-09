'use client';
import { MapPin, AlertTriangle } from '@/components/animate-ui/icons';
import { fmtPlace } from '@/lib/format';

/** สถานที่ & เวลา: venue card and the report-in rule. */
export default function VenueTab({ match, sport }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div
        style={{
          background: 'var(--surface-2)',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--accent-surface)',
            border: '1px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MapPin size={18} style={{ color: 'var(--accent-text)' }} />
        </div>
        <div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '2px',
            }}
          >
            {fmtPlace(match, sport?.venue)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
            มหาวิทยาลัยราชภัฏภูเก็ต • คณะวิทยาศาสตร์และเทคโนโลยี
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--accent-surface)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          border: '1px solid var(--accent-border)',
          fontSize: '0.82rem',
          color: 'var(--accent-text)',
          lineHeight: 1.6,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <AlertTriangle size={16} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          {/* same wording in every sport's section of the handbook (ข้อ 6 การรายงานตัว) */}
          <strong>การรายงานตัว:</strong> ทีมต้องมาถึงสนามก่อนเวลาแข่งขันอย่างน้อย 10 นาที
          หากไม่พร้อมลงสนามภายใน 10 นาทีหลังเวลาที่กำหนด ให้ถือว่าสละสิทธิ์และปรับเป็นแพ้ในนัดนั้น (
          <a href="/handbook" style={{ color: 'inherit', fontWeight: 700 }}>
            สูจิบัตร
          </a>
          )
        </div>
      </div>
    </div>
  );
}
