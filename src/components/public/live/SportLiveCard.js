'use client';
import Link from 'next/link';
import { SportIcon } from '@/components/ui/SportIcon';
import LiveMatchScore from './LiveMatchScore';
import { matchesForSport, relativeTime, ROUND_LABEL } from '@/hooks/useLiveScores';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', paddingRight: showIndicator ? '4.5rem' : 0 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'var(--sci-yellow-surface)',
            border: '1px solid var(--sci-yellow-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-700)',
          }}
        >
          <SportIcon sportId={sport.id} sportName={sport.name} size={18} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--mono-900)' }}>{sport.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--mono-500)' }}>
            {current
              ? `${current.venue || ''}${current.round ? ` · ${ROUND_LABEL[current.round] || current.round}` : ''}`
              : `จบแล้ว ${finished.length} · รอแข่ง ${upcoming.length}`}
          </div>
        </div>
        <StatusChip current={current} next={next} last={last} liveCount={live.length} />
      </div>

      {shown ? (
        <LiveMatchScore match={shown} sport={sport} teams={teams} sets={setsByMatch[shown.id] || []} bump={showIndicator ? bump : null} />
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--mono-400)', fontSize: '0.9rem', padding: '0.75rem 0' }}>
          ยังไม่มีตารางแข่ง
        </div>
      )}

      {/* footer */}
      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--mono-500)' }}>
        <span>
          {current
            ? current.last_score_at
              ? now ? `อัปเดตล่าสุด ${relativeTime(current.last_score_at, now)}` : ''
              : 'เริ่มแข่งแล้ว รอคะแนนแรก'
            : last
            ? now ? `ผลล่าสุด ${relativeTime(last.finished_at, now) || ''}` : ''
            : next
            ? `คู่ถัดไป ${fmtDate(next.match_date)} ${next.match_time?.slice(0, 5)} น.`
            : ''}
        </span>
        <span style={{ color: 'var(--gold-700)', fontWeight: 700 }}>ดูทั้งหมด ›</span>
      </div>
    </Link>
  );
}

function StatusChip({ current, next, last, liveCount }) {
  if (current) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 9px',
          borderRadius: 999,
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#b91c1c',
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
        }}
      >
        <span className="live-dot" /> LIVE{liveCount > 1 ? ` +${liveCount - 1}` : ''}
      </span>
    );
  }
  if (next && !last) {
    return <Chip>รอแข่ง {next.match_time?.slice(0, 5)}</Chip>;
  }
  if (last) return <Chip>จบแล้ว</Chip>;
  return null;
}

function Chip({ children }) {
  return (
    <span style={{ padding: '4px 9px', borderRadius: 999, background: 'var(--mono-100)', color: 'var(--mono-600)', fontSize: '0.72rem', fontWeight: 700 }}>
      {children}
    </span>
  );
}

export function fmtDate(d) {
  return { '2026-10-09': 'ศ. 9 ต.ค.', '2026-10-10': 'ส. 10 ต.ค.', '2026-10-11': 'อา. 11 ต.ค.' }[d] || (d ? d.slice(5) : '');
}
