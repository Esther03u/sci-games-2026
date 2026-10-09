'use client';
import MatchCard from '@/components/ui/MatchCard';
import { Clock } from '@/components/animate-ui/icons';
import { fmtEventDayLong as getDateLabel } from '@/lib/format';
import { findSportFor } from '@/lib/schedule-grid';

/** "ตามเวลา" view: one section per day, matches grouped by time slot. */
export default function TimeView({ scheduleData, sports, teams }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {Object.values(scheduleData).map((dateGroup) => (
        <div key={dateGroup.dateStr}>
          {/* Date Section Header Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.65rem',
              borderBottom: '2px solid var(--border)',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                {getDateLabel(dateGroup.dateStr)}
              </h2>
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-3)',
                fontWeight: 700,
                background: 'var(--surface-2)',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
              }}
            >
              {dateGroup.totalMatches} แมตช์
            </span>
          </div>

          {/* Time Slots under this Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {Object.entries(dateGroup.timeSlots).map(([timeLabel, slotMatches]) => (
              <div key={timeLabel}>
                {/* Time Slot Divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Clock size={16} style={{ color: 'var(--accent-text)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)' }}>
                    รอบเวลา {timeLabel}
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
                    {slotMatches.length} คู่แข่งขัน
                  </span>
                </div>

                {/* Grid of Dark Luxury Match Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
                    gap: '1rem',
                  }}
                >
                  {slotMatches.map((m) => {
                    const sport = findSportFor(m, sports);
                    return (
                      <MatchCard key={m.id} match={m} teams={teams} sport={sport} isScheduleView={true} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
