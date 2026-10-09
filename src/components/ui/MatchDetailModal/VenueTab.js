'use client';
import { MapPin, AlertTriangle } from '@/components/animate-ui/icons';
import { fmtPlace } from '@/lib/format';

/** สถานที่ & เวลา: venue card and the report-in rule. */
export default function VenueTab({ match, sport }) {
  return (
    <div className="md-tab-stack-md">
      <div className="md-venue-card">
        <div className="md-venue-icon">
          <MapPin size={18} style={{ color: 'var(--accent-text)' }} />
        </div>
        <div>
          <div className="md-venue-name">{fmtPlace(match, sport?.venue)}</div>
          <div className="md-venue-sub">มหาวิทยาลัยราชภัฏภูเก็ต • คณะวิทยาศาสตร์และเทคโนโลยี</div>
        </div>
      </div>

      <div className="md-report-note">
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
