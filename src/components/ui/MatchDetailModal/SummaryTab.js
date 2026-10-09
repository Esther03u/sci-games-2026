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
    <div className="md-tab-stack-lg">
      {(isPendingA || isPendingB) && (
        <div className="md-pending-note">
          <Info size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
          <span>
            แมตช์นี้จะแข่งขันหลังจบรอบตัดเชือก โดยทีมที่ผ่านการคัดเลือกจะถูกส่งต่อเข้าสู่รอบนี้โดยอัตโนมัติ
          </span>
        </div>
      )}
      {/* Per-set scores (set sports, results mode) */}
      {setRows.length > 0 && (
        <div className="md-box">
          <div className="md-sets-title">คะแนนรายเซต</div>
          <div className="md-sets">
            {setRows.map((s) => (
              <div key={s.n} className="md-set-row">
                <span className="md-muted">
                  เซต {s.n}
                  {s.live && <span className="md-set-live"> •</span>}
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
                <span className="md-set-score">
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
      <div className="md-box">
        <div className="md-summary-title">
          {isScheduleView ? 'ข้อมูลการประกบคู่แข่งขัน' : 'บทวิเคราะห์ & สรุปแมตช์'}
        </div>
        <p className="md-summary-text">
          {isScheduleView
            ? `การประกบคู่แข่งขันใน${roundText}${catText} ณ ${fmtPlace(match)} กำหนดเวลา ${matchTimeStr}`
            : match.summary || 'การแข่งขันรอบสำคัญในงาน Sci Games 2026'}
        </p>
      </div>

      {/* Match Details Quick Specs */}
      <div className="md-specs">
        <div className="md-spec">
          <span className="md-spec-label">เวลาแข่งขัน</span>
          <strong className="md-text">{matchTimeStr}</strong>
        </div>
        <div className="md-spec">
          <span className="md-spec-label">สนามแข่งขัน</span>
          <strong className="md-text">{fmtPlace(match)}</strong>
        </div>
        <div className="md-spec">
          <span className="md-spec-label">รอบการแข่ง</span>
          <strong className="md-text">
            {roundText}
            {catText}
          </strong>
        </div>
        <div className="md-spec">
          <span className="md-spec-label">ระยะเวลาแข่งขัน</span>
          <strong className="md-text">{matchDuration || 'ตามระเบียบสูจิบัตร'}</strong>
        </div>
      </div>
    </div>
  );
}
