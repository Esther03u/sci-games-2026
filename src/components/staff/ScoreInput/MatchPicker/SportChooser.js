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
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
          เลือกชนิดกีฬาที่จะลงคะแนน
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-3)',
          }}
        >
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
        <div
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <Shield size={18} style={{ color: 'var(--gold-600)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}
            >
              โหมดผู้ดูแลระบบ (Admin)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.45 }}>
              เลือกชนิดกีฬาที่ต้องการลงคะแนนเพื่อดูเฉพาะแมตช์ของกีฬานั้นอย่างชัดเจนและใช้งานง่าย
            </div>
          </div>
        </div>
      )}

      {offlineBanner}
      <Banner kind="error">{error}</Banner>

      {/* Sport Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.5rem',
        }}
      >
        {availableSports.map((s) => {
          const sportMatches = matches.filter((m) => m.sport_id === s.id);
          const liveCount = sportMatches.filter((m) => m.status === 'live').length;
          const upcomingCount = sportMatches.filter((m) => m.status === 'scheduled').length;
          const finishedCount = sportMatches.filter((m) => m.status === 'finished').length;

          return (
            <div key={s.id} className="sport-select-card" {...pressable(() => onSelectSport(s.id))}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    {s.name}
                  </h3>
                  {liveCount > 0 && (
                    <span className="live-pill">
                      <span className="live-dot" /> {liveCount} คู่กำลังแข่ง
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-3)',
                    marginTop: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
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
                <span style={{ fontSize: '1.1rem' }}>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview button for Admin only */}
      {isAdmin && (
        <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
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
