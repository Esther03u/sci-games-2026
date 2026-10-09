'use client';
import { pressable } from '@/lib/pressable';
import { Shield } from '@/components/animate-ui/icons';
import Banner from '@/components/ui/Banner';

/** Screen A — admins / multi-sport staff choose a sport before seeing its matches. */
export default function SportChooser({
  matches,
  availableSports,
  isAdmin,
  realtimeStatus,
  offlineBanner,
  error,
  onSelectSport,
}) {
  return (
    <div className="mp-page">
      {/* Title Header */}
      <div className="msc-head">
        <h2 className="msc-title">เลือกชนิดกีฬาที่จะลงคะแนน</h2>
        <div className="msc-status">
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: realtimeStatus === 'SUBSCRIBED' ? '#22c55e' : 'var(--gold-500)',
            }}
          />
          <span>
            {realtimeStatus === 'SUBSCRIBED' ? 'ข้อมูลอัปเดตแบบเรียลไทม์' : 'กำลังเชื่อมต่อ Realtime...'}
          </span>
        </div>
      </div>

      {/* Notice */}
      {isAdmin && (
        <div className="msc-admin-note">
          <Shield size={18} style={{ color: 'var(--gold-600)', marginTop: '2px', flexShrink: 0 }} />
          <div className="msc-admin-note-body">
            <div className="msc-admin-note-title">โหมดผู้ดูแลระบบ (Admin)</div>
            <div className="msc-admin-note-text">
              เลือกชนิดกีฬาที่ต้องการลงคะแนนเพื่อดูเฉพาะแมตช์ของกีฬานั้นอย่างชัดเจนและใช้งานง่าย
            </div>
          </div>
        </div>
      )}

      {offlineBanner}
      <Banner kind="error">{error}</Banner>

      {/* Sport Cards Grid */}
      <div className="msc-grid">
        {availableSports.map((s) => {
          const sportMatches = matches.filter((m) => m.sport_id === s.id);
          const liveCount = sportMatches.filter((m) => m.status === 'live').length;
          const upcomingCount = sportMatches.filter((m) => m.status === 'scheduled').length;
          const finishedCount = sportMatches.filter((m) => m.status === 'finished').length;

          return (
            <div key={s.id} className="sport-select-card" {...pressable(() => onSelectSport(s.id))}>
              <div>
                <div className="msc-card-head">
                  <h3 className="msc-card-title">{s.name}</h3>
                  {liveCount > 0 && (
                    <span className="live-pill">
                      <span className="live-dot" /> {liveCount} คู่กำลังแข่ง
                    </span>
                  )}
                </div>
                <div className="msc-card-meta">
                  <span>{sportMatches.length} แมตช์</span>
                  <span>·</span>
                  <span>รอแข่ง {upcomingCount}</span>
                  {finishedCount > 0 && (
                    <>
                      <span>·</span>
                      <span>จบแล้ว {finishedCount}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="sport-select-footer">
                <span>เลือกลงคะแนนกีฬา{s.name}</span>
                <span className="msc-card-arrow">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview button for Admin only */}
      {isAdmin && (
        <div className="msc-overview">
          <button
            type="button"
            onClick={() => onSelectSport('all')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            📋 แสดงทุกกีฬาพร้อมกัน (โหมดภาพรวม)
          </button>
        </div>
      )}
    </div>
  );
}
