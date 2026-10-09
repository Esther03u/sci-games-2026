'use client';
import { Info } from '@/components/animate-ui/icons';
import { fmtPlace } from '@/lib/format';

/** ภาพรวม: pending-bracket note, per-set scores, summary text and quick specs. */
export default function SummaryTab({
  match,
  teamA,
  teamB,
  isPendingA,
  isPendingB,
  setRows,
  isScheduleView,
  roundText,
  catText,
  matchTimeStr,
  matchDuration,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(isPendingA || isPendingB) && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'rgba(100, 116, 139, 0.08)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.82rem',
            color: 'var(--text-2)',
          }}
        >
          <Info size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
          <span>
            แมตช์นี้จะแข่งขันหลังจบรอบตัดเชือก โดยทีมที่ผ่านการคัดเลือกจะถูกส่งต่อเข้าสู่รอบนี้โดยอัตโนมัติ
          </span>
        </div>
      )}
      {/* Per-set scores (set sports, results mode) */}
      {setRows.length > 0 && (
        <div
          style={{
            background: 'var(--surface-2)',
            borderRadius: '14px',
            padding: '1rem',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--accent-text)',
              marginBottom: '0.6rem',
            }}
          >
            คะแนนรายเซต
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.88rem',
            }}
          >
            {setRows.map((s) => (
              <div
                key={s.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr auto 1fr',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ color: 'var(--text-3)' }}>
                  เซต {s.n}
                  {s.live && <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}> •</span>}
                </span>
                <span
                  style={{
                    textAlign: 'right',
                    color: s.winner === 'a' ? 'var(--text)' : 'var(--text-3)',
                    fontWeight: s.winner === 'a' ? 800 : 600,
                  }}
                >
                  {teamA.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.a} – {s.b}
                </span>
                <span
                  style={{
                    color: s.winner === 'b' ? 'var(--text)' : 'var(--text-3)',
                    fontWeight: s.winner === 'b' ? 800 : 600,
                  }}
                >
                  {teamB.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Information Card */}
      <div
        style={{
          background: 'var(--surface-2)',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '0.4rem',
          }}
        >
          {isScheduleView ? 'ข้อมูลการประกบคู่แข่งขัน' : 'บทวิเคราะห์ & สรุปแมตช์'}
        </div>
        <p style={{ fontSize: '0.88rem', color: '#3f3f46', lineHeight: 1.6, margin: 0 }}>
          {isScheduleView
            ? `การประกบคู่แข่งขันใน${roundText}${catText} ณ ${fmtPlace(match)} กำหนดเวลา ${matchTimeStr}`
            : match.summary || 'การแข่งขันรอบสำคัญในงาน Sci Games 2026'}
        </p>
      </div>

      {/* Match Details Quick Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          fontSize: '0.82rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface-2)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>เวลาแข่งขัน</span>
          <strong style={{ color: 'var(--text)' }}>{matchTimeStr}</strong>
        </div>
        <div
          style={{
            background: 'var(--surface-2)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>สนามแข่งขัน</span>
          <strong style={{ color: 'var(--text)' }}>{fmtPlace(match)}</strong>
        </div>
        <div
          style={{
            background: 'var(--surface-2)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>รอบการแข่ง</span>
          <strong style={{ color: 'var(--text)' }}>
            {roundText}
            {catText}
          </strong>
        </div>
        <div
          style={{
            background: 'var(--surface-2)',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>
            ระยะเวลาแข่งขัน
          </span>
          <strong style={{ color: 'var(--text)' }}>{matchDuration || 'ตามระเบียบสูจิบัตร'}</strong>
        </div>
      </div>
    </div>
  );
}
