'use client';
import MatchCard from '@/components/ui/MatchCard';
import { fmtEventDayLong as getDateLabel } from '@/lib/format';

/** "ตามกีฬา" view: one section per sport, matches grouped by day. */
export default function SportView({ groups, teams }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {groups.map((g) => (
        <section key={g.sport?.id || 'other'}>
          {/* Sport Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '0.65rem',
              borderBottom: '2px solid var(--border)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {g.sport?.name || 'กีฬาอื่น ๆ'}
              </h2>
              {g.sport?.venue && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-3)',
                    marginTop: '3px',
                  }}
                >
                  {g.sport.venue}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-3)',
                fontWeight: 700,
                background: 'var(--surface-2)',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
              }}
            >
              {g.total} แมตช์
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.entries(g.dates).map(([date, list]) => (
              <div key={date}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.6rem',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                    {getDateLabel(date)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-3)',
                      background: 'var(--surface-2)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 600,
                    }}
                  >
                    {list.length} คู่
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
                    gap: '1rem',
                  }}
                >
                  {list.map((m) => (
                    <MatchCard key={m.id} match={m} teams={teams} sport={g.sport} isScheduleView={true} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
