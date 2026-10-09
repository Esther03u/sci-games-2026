'use client';
import MatchCard from '@/components/ui/MatchCard';
import { Clock } from '@/components/animate-ui/icons';
import { fmtEventDayLong as getDateLabel } from '@/lib/format';
import { findSportFor } from '@/lib/schedule-grid';

/** "ตามเวลา" view: one section per day, matches grouped by time slot. */
export default function TimeView({ scheduleData, sports, teams }) {
  return (
    <div className="sg-sections">
      {Object.values(scheduleData).map((dateGroup) => (
        <div key={dateGroup.dateStr}>
          {/* Date Section Header Banner */}
          <div className="sg-date-head">
            <div>
              <h2 className="sg-date-title">{getDateLabel(dateGroup.dateStr)}</h2>
            </div>
            <span className="sg-date-count">{dateGroup.totalMatches} แมตช์</span>
          </div>

          {/* Time Slots under this Date */}
          <div className="sg-slots">
            {Object.entries(dateGroup.timeSlots).map(([timeLabel, slotMatches]) => (
              <div key={timeLabel}>
                {/* Time Slot Divider */}
                <div className="sg-slot-head">
                  <Clock size={16} style={{ color: 'var(--accent-text)' }} />
                  <span className="sg-slot-title">รอบเวลา {timeLabel}</span>
                  <span className="sg-day-count">{slotMatches.length} คู่แข่งขัน</span>
                </div>

                {/* Grid of Dark Luxury Match Cards */}
                <div className="sg-card-grid">
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
