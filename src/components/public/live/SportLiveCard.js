'use client';
import Link from 'next/link';
import { SportIcon } from '@/components/ui/SportIcon';
import LiveMatchScore from './LiveMatchScore';
import { matchesForSport } from '@/hooks/useLiveScores';
import { relativeTime, fmtEventDay, fmtTime, fmtPlace } from '@/lib/format';
import { ROUND_LABEL } from '@/lib/labels';

/**
 * One fixed-position card per sport on /live.
 * Shows the live match (first one if several), otherwise the next match or
 * the latest result. The ↑ chip appears only for score increments.
 */
export default function SportLiveCard({ sport, matches, teams, setsByMatch, bumps, now }) {
  const { live, upcoming, finished } = matchesForSport(matches, sport.id);
  const current = live[0] || null;
  const next = upcoming[0] || null;
  const last = finished[0] || null;
  const shown = current || last || next;
  const bump = current ? bumps[current.id] : null;
  const showIndicator = Boolean(bump && now && now - bump.at < 3000);

  const border = current ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--glass-border)';

  return (
    <Link
      href={`/live/${sport.id}`}
      className="glass-card"
      style={{
        display: 'block',
        position: 'relative',
        padding: '1rem 1.1rem 0.9rem',
        border,
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: current ? '0 10px 30px -10px rgba(239, 68, 68, 0.25)' : undefined,
      }}
    >
      {showIndicator && (
        <span key={bump.at} className="live-indicator" aria-live="polite">
          ↑ +แต้ม
        </span>
      )}

      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.8rem',
          paddingRight: showIndicator ? '4.5rem' : 0,
        }}
      >
        <span className="slc-icon">
          <SportIcon sportId={sport.id} sportName={sport.name} size={18} />
        </span>
        <div className="slc-info">
          <div className="slc-name">{sport.name}</div>
          <div className="slc-sub">
            {current
              ? `${fmtPlace(current)}${current.round ? ` · ${ROUND_LABEL[current.round] || current.round}` : ''}${current.category && !(ROUND_LABEL[current.round] || current.round || '').includes(current.category) ? ` (${current.category})` : ''}`
              : `จบแล้ว ${finished.length} · รอแข่ง ${upcoming.length}`}
          </div>
        </div>
        <StatusChip current={current} next={next} last={last} liveCount={live.length} />
      </div>

      {shown ? (
        <LiveMatchScore
          match={shown}
          sport={sport}
          teams={teams}
          sets={setsByMatch[shown.id] || []}
          bump={showIndicator ? bump : null}
        />
      ) : (
        <div className="slc-empty">ยังไม่มีตารางแข่ง</div>
      )}

      {/* footer */}
      <div className="slc-foot">
        <span>
          {current
            ? current.last_score_at
              ? now
                ? `อัปเดตล่าสุด ${relativeTime(current.last_score_at, now)}`
                : ''
              : 'เริ่มแข่งแล้ว รอคะแนนแรก'
            : last
              ? now
                ? `ผลล่าสุด ${relativeTime(last.finished_at, now) || ''}`
                : ''
              : next
                ? `คู่ถัดไป ${fmtEventDay(next.match_date)} ${fmtTime(next.match_time)} น.`
                : ''}
        </span>
        <span className="slc-more">ดูทั้งหมด ›</span>
      </div>
    </Link>
  );
}

function StatusChip({ current, next, last, liveCount }) {
  if (current) {
    return (
      <span className="slc-live">
        <span className="live-dot" /> LIVE{liveCount > 1 ? ` +${liveCount - 1}` : ''}
      </span>
    );
  }
  if (next && !last) {
    return <Chip>รอแข่ง {fmtTime(next.match_time)}</Chip>;
  }
  if (last) return <Chip>จบแล้ว</Chip>;
  return null;
}

function Chip({ children }) {
  return <span className="slc-status">{children}</span>;
}
