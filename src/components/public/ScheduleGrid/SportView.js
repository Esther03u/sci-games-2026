'use client';
import MatchCard from '@/components/ui/MatchCard';
import { fmtEventDayLong as getDateLabel } from '@/lib/format';

/** "ตามกีฬา" view: one section per sport, matches grouped by day. */
export default function SportView({ groups, teams }) {
  return (
    <div className="sg-sections">
      {groups.map((g) => (
        <section key={g.sport?.id || 'other'}>
          {/* Sport Section Header */}
          <div className="sg-section-head">
            <div className="sg-section-title-wrap">
              <h2 className="sg-sport-title">{g.sport?.name || 'กีฬาอื่น ๆ'}</h2>
              {g.sport?.venue && <div className="sg-sport-venue">{g.sport.venue}</div>}
            </div>
            <span className="sg-count-pill">{g.total} แมตช์</span>
          </div>

          <div className="sg-day-groups">
            {Object.entries(g.dates).map(([date, list]) => (
              <div key={date}>
                <div className="sg-day-head">
                  <span className="sg-day-title">{getDateLabel(date)}</span>
                  <span className="sg-day-count">{list.length} คู่</span>
                </div>
                <div className="sg-card-grid">
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
