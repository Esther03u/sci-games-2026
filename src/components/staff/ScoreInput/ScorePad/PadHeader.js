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
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontWeight: 800,
            color: 'var(--text)',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sport?.name}
          {(match.round || match.category) && (
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>
              {' '}
              · {roundLabel(match.round)}
              {match.category && !roundLabel(match.round)?.includes(match.category)
                ? ` (${match.category})`
                : ''}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '0.74rem',
            color: 'var(--text-3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {fmtPlace(match)} · {fmtTime(match.match_time)} น.
        </div>
      </div>
      {live ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger-text)',
            fontSize: '0.74rem',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          <span className="live-dot" /> {elapsed || 'LIVE'}
        </span>
      ) : (
        <StatusBadge status={match.status} />
      )}
    </div>
  );
}
