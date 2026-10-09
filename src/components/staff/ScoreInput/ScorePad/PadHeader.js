'use client';
import StatusBadge from '@/components/ui/StatusBadge';
import { fmtTime, fmtPlace } from '@/lib/format';
import { roundLabel } from '@/lib/labels';

/** Back button, sport · round, place · time, and the LIVE timer / status badge. */
export default function PadHeader({ match, sport, live, elapsed, pending, onBack }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '0.65rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onBack}
        className="btn btn-secondary btn-sm"
        disabled={pending > 0}
        style={{ padding: '0.45rem 0.7rem', flexShrink: 0 }}
      >
        ‹ แมตช์
      </button>
      <div className="sp-head-info">
        <div className="sp-head-title">
          {sport?.name}
          {(match.round || match.category) && (
            <span className="sp-head-round">
              {' '}
              · {roundLabel(match.round)}
              {match.category && !roundLabel(match.round)?.includes(match.category)
                ? ` (${match.category})`
                : ''}
            </span>
          )}
        </div>
        <div className="sp-head-sub">
          {fmtPlace(match)} · {fmtTime(match.match_time)} น.
        </div>
      </div>
      {live ? (
        <span className="sp-live-chip">
          <span className="live-dot" /> {elapsed || 'LIVE'}
        </span>
      ) : (
        <StatusBadge status={match.status} />
      )}
    </div>
  );
}
